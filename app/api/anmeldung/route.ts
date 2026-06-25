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

  const { email, documents, newsletter, source } = (body ?? {}) as {
    email?: string;
    documents?: unknown[];
    newsletter?: boolean;
    source?: string;
  };

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Bitte geben Sie eine gültige E-Mail-Adresse ein." },
      { status: 400 }
    );
  }
  const cleanEmail = email.trim();

  const selectedDocs: DocumentId[] = Array.isArray(documents)
    ? (documents.filter(isDocumentId) as DocumentId[])
    : [];

  const hasWhitepaper =
    selectedDocs.includes("whitepaper_de") ||
    selectedDocs.includes("whitepaper_en");

  if (!hasWhitepaper) {
    return NextResponse.json(
      { error: "Bitte wählen Sie mindestens ein Whitepaper aus." },
      { status: 400 }
    );
  }

  const baseUrl = resolveBaseUrl(req);
  const lang: "de" | "en" = selectedDocs.includes("whitepaper_de") ? "de" : "en";
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
      source: source || "Whitepaper Landingpage",
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
    return NextResponse.json(
      { error: "Der E-Mail-Versand ist fehlgeschlagen. Bitte später erneut versuchen." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, confirmed: false });
}
