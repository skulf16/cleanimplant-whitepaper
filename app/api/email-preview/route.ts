import { NextRequest, NextResponse } from "next/server";
import { buildDownloadEmail } from "@/lib/email-template";
import { DocumentId, isDocumentId } from "@/lib/documents";

export const runtime = "nodejs";

// Nur zur Entwicklung: zeigt die gestylte Download-Mail im Browser.
// In Produktion deaktiviert.
// Auswahl simulieren über ?docs=whitepaper_de,guidelines (Komma-getrennt).
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  const lang = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "de";

  // Auswahl aus Query lesen; sonst nur die Variante passend zur Sprache
  const docsParam = req.nextUrl.searchParams.get("docs");
  const docs: DocumentId[] = docsParam
    ? docsParam.split(",").filter(isDocumentId)
    : [lang === "en" ? "whitepaper_en" : "whitepaper_de"];

  const { html } = buildDownloadEmail({
    documents: docs,
    baseUrl: req.nextUrl.origin,
    lang,
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
