import { NextRequest, NextResponse } from "next/server";
import { DocumentId, DOCUMENTS, isDocumentId } from "@/lib/documents";
import { buildDownloadEmail } from "@/lib/email-template";
import { signedDownloadUrl } from "@/lib/token";
import { sendMail } from "@/lib/mailer";
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

  const {
    email,
    documents,
    roles,
    newsletter,
    source,
  } = (body ?? {}) as {
    email?: string;
    documents?: unknown[];
    roles?: string[];
    newsletter?: boolean;
    source?: string;
  };

  // Validierung
  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Bitte geben Sie eine gültige E-Mail-Adresse ein." },
      { status: 400 }
    );
  }

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

  // E-Mail-Sprache: Englisch nur, wenn ausschließlich englische Inhalte gewählt
  const wantsGerman = selectedDocs.includes("whitepaper_de");
  const lang: "de" | "en" = wantsGerman ? "de" : "en";

  const links = selectedDocs.map((id) => ({
    label: DOCUMENTS[id].label,
    url: signedDownloadUrl(baseUrl, id),
  }));

  // 1. Download-Mail versenden (transaktional, ohne Double-Opt-in)
  try {
    const mail = buildDownloadEmail({ documents: selectedDocs, baseUrl, lang });
    await sendMail({ to: email.trim(), ...mail });
  } catch (err) {
    console.error("[anmeldung] Mailversand fehlgeschlagen:", err);
    return NextResponse.json(
      { error: "Der E-Mail-Versand ist fehlgeschlagen. Bitte später erneut versuchen." },
      { status: 502 }
    );
  }

  // 2. Newsletter (optional) – nur bei Zustimmung, mit Double-Opt-in via CleverReach
  if (newsletter === true) {
    try {
      await subscribeToNewsletter({
        email: email.trim(),
        lang,
        source: source || "whitepaper-landingpage",
        attributes: {
          roles: Array.isArray(roles) ? roles.join(",") : "",
        },
      });
    } catch (err) {
      // Newsletter-Fehler darf den Download nicht blockieren
      console.error("[anmeldung] CleverReach-Anmeldung fehlgeschlagen:", err);
    }
  }

  return NextResponse.json({ ok: true, links });
}
