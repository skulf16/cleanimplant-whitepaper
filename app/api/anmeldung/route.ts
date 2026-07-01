import { NextRequest, NextResponse } from "next/server";
import { DocumentId, DOCUMENTS, isDocumentId } from "@/lib/documents";
import { buildDownloadEmail, buildConfirmEmail } from "@/lib/email-template";
import { signedDownloadUrl, createConfirmToken } from "@/lib/token";
import { sendMail, isMailConfigured } from "@/lib/mailer";
import { isContactActive, addContactPending } from "@/lib/cleverreach";

export const runtime = "nodejs";

function resolveBaseUrl(req: NextRequest): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return `${proto}://${host}`;
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const { email, documents, roles, newsletter, source, locale } = (body ??
    {}) as {
    email?: string;
    documents?: unknown[];
    roles?: string[];
    newsletter?: boolean;
    source?: string;
    locale?: string;
  };

  // Sprache = Seitensprache (Fallback Deutsch)
  const lang: "de" | "en" = locale === "en" ? "en" : "de";
  const ERR = {
    de: {
      email: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      wp: "Bitte wählen Sie mindestens ein White Paper aus.",
      mail: "Der E-Mail-Versand ist fehlgeschlagen. Bitte später erneut versuchen.",
    },
    en: {
      email: "Please enter a valid email address.",
      wp: "Please select at least one White Paper.",
      mail: "Sending the email failed. Please try again later.",
    },
  }[lang];

  const profession = Array.isArray(roles) ? roles.join(", ") : "";

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: ERR.email }, { status: 400 });
  }
  const cleanEmail = email.trim();

  const selectedDocs: DocumentId[] = Array.isArray(documents)
    ? (documents.filter(isDocumentId) as DocumentId[])
    : [];

  const hasWhitepaper =
    selectedDocs.includes("whitepaper_de") ||
    selectedDocs.includes("whitepaper_en");

  if (!hasWhitepaper) {
    return NextResponse.json({ error: ERR.wp }, { status: 400 });
  }

  const baseUrl = resolveBaseUrl(req);
  const links = selectedDocs.map((id) => ({
    label: DOCUMENTS[id].label,
    url: signedDownloadUrl(baseUrl, id),
  }));

  // Ist die Adresse bereits ein aktiver/bestätigter Kontakt? → sofort ausliefern
  let alreadyActive = false;
  try {
    alreadyActive = await isContactActive(cleanEmail);
  } catch (err) {
    console.error("[anmeldung] Status-Abfrage fehlgeschlagen:", err);
  }

  // Ohne SMTP kann keine Bestätigungsmail raus → Download direkt ausliefern (Fallback)
  if (alreadyActive || !isMailConfigured()) {
    try {
      const mail = buildDownloadEmail({ documents: selectedDocs, baseUrl, lang });
      await sendMail({ to: cleanEmail, ...mail });
    } catch (err) {
      console.error("[anmeldung] Download-Mail fehlgeschlagen:", err);
    }
    return NextResponse.json({ ok: true, confirmed: true, links });
  }

  // Neue Adresse: als ausstehend in CleverReach anlegen (Lead sichern)
  try {
    await addContactPending({
      email: cleanEmail,
      lang,
      wantsGuideline: selectedDocs.includes("guidelines"),
      newsletter: newsletter === true,
      profession,
      source: source || "White Paper Landingpage",
    });
  } catch (err) {
    console.error("[anmeldung] CleverReach (pending) fehlgeschlagen:", err);
  }

  // Eigene Bestätigungsmail mit Bestätigungs-/Download-Link senden
  const token = createConfirmToken({
    email: cleanEmail,
    documents: selectedDocs,
    newsletter: newsletter === true,
    lang,
  });
  const confirmUrl = `${baseUrl.replace(/\/$/, "")}/bestaetigen?token=${token}`;

  try {
    const mail = buildConfirmEmail({
      confirmUrl,
      documents: selectedDocs,
      lang,
      baseUrl,
    });
    await sendMail({ to: cleanEmail, ...mail });
  } catch (err) {
    console.error("[anmeldung] Bestätigungsmail fehlgeschlagen:", err);
    return NextResponse.json({ error: ERR.mail }, { status: 502 });
  }

  return NextResponse.json({ ok: true, confirmed: false });
}
