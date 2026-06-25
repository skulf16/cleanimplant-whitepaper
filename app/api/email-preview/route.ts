import { NextRequest, NextResponse } from "next/server";
import { buildDownloadEmail } from "@/lib/email-template";
import { DocumentId } from "@/lib/documents";

export const runtime = "nodejs";

// Nur zur Entwicklung: zeigt die gestylte Download-Mail im Browser.
// In Produktion deaktiviert.
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  const lang = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "de";
  const docs: DocumentId[] = ["whitepaper_de", "whitepaper_en", "guidelines"];

  const { html } = buildDownloadEmail({
    documents: docs,
    baseUrl: req.nextUrl.origin,
    lang,
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
