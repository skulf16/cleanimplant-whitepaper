import { NextRequest, NextResponse } from "next/server";
import { DocumentId, docLabel, isDocumentId } from "@/lib/documents";
import {
  buildDownloadEmail,
  buildNotificationEmail,
} from "@/lib/email-template";
import { signedDownloadUrl } from "@/lib/token";
import { sendMail, isMailConfigured } from "@/lib/mailer";
import { subscribeToNewsletter } from "@/lib/cleverreach";

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

  const { email, documents, roles, newsletter, name, source, locale } = (body ??
    {}) as {
    email?: string;
    documents?: unknown[];
    roles?: string[];
    newsletter?: boolean;
    name?: string;
    source?: string;
    locale?: string;
  };

  // Name (nur bei Newsletter) in Vor-/Nachname aufteilen
  const fullName = (name || "").trim().replace(/\s+/g, " ");
  const firstName = fullName.includes(" ")
    ? fullName.slice(0, fullName.indexOf(" "))
    : fullName;
  const lastName = fullName.includes(" ")
    ? fullName.slice(fullName.indexOf(" ") + 1)
    : "";

  // Sprache = Seitensprache (Fallback Deutsch)
  const lang: "de" | "en" = locale === "en" ? "en" : "de";
  const ERR = {
    de: {
      email: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      doc: "Bitte wählen Sie mindestens ein Dokument aus.",
      mail: "Der E-Mail-Versand ist fehlgeschlagen. Bitte später erneut versuchen.",
    },
    en: {
      email: "Please enter a valid email address.",
      doc: "Please select at least one document.",
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

  if (selectedDocs.length === 0) {
    return NextResponse.json({ error: ERR.doc }, { status: 400 });
  }

  const baseUrl = resolveBaseUrl(req);
  const links = selectedDocs.map((id) => ({
    label: docLabel(id, lang),
    url: signedDownloadUrl(baseUrl, id),
  }));

  const role = Array.isArray(roles) ? roles.join(", ") : "";

  // Interne Benachrichtigung an das Team (mit Lead-Daten)
  async function notify(status: string) {
    // Mehrere Empfänger möglich (komma-getrennt in NOTIFY_EMAIL)
    const to = (process.env.NOTIFY_EMAIL || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .join(", ");
    if (!to || !isMailConfigured()) return;
    try {
      const mail = buildNotificationEmail({
        email: cleanEmail,
        name: fullName,
        role,
        documents: selectedDocs,
        newsletter: newsletter === true,
        lang,
        source: source || "White Paper Landingpage",
        status,
      });
      await sendMail({ to, ...mail });
    } catch (err) {
      console.error("[anmeldung] Benachrichtigung fehlgeschlagen:", err);
    }
  }

  // Download-Mail versenden – immer sofort, kein Double-Opt-in für den Download
  try {
    const mail = buildDownloadEmail({ documents: selectedDocs, baseUrl, lang });
    await sendMail({ to: cleanEmail, ...mail });
  } catch (err) {
    console.error("[anmeldung] Download-Mail fehlgeschlagen:", err);
  }

  // Newsletter nur bei Zustimmung: DE = Double-Opt-in, EN = Single-Opt-in
  if (newsletter === true) {
    try {
      await subscribeToNewsletter({
        email: cleanEmail,
        lang,
        wantsGuideline: selectedDocs.includes("guidelines"),
        profession,
        firstName,
        lastName,
        source: source || "White Paper Landingpage",
        userIp: req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "",
        userAgent: req.headers.get("user-agent") || "",
      });
    } catch (err) {
      console.error("[anmeldung] Newsletter-Anmeldung fehlgeschlagen:", err);
    }
  }

  const nlNote =
    newsletter === true
      ? lang === "de"
        ? "Newsletter (DE): Double-Opt-in ausstehend"
        : "Newsletter (EN): Single-Opt-in aktiv"
      : "kein Newsletter";
  await notify(`Download bereitgestellt · ${nlNote}`);

  return NextResponse.json({ ok: true, confirmed: true, links });
}
