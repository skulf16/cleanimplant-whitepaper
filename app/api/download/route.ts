import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { DOCUMENTS, PROTECTED_DIR } from "@/lib/documents";
import { verifyDownloadToken } from "@/lib/token";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return new NextResponse("Fehlender Download-Token.", { status: 400 });
  }

  const docId = verifyDownloadToken(token);
  if (!docId) {
    return new NextResponse("Link ungültig oder abgelaufen.", { status: 403 });
  }

  const doc = DOCUMENTS[docId];
  const filePath = path.join(process.cwd(), PROTECTED_DIR, doc.file);

  try {
    const data = await fs.readFile(filePath);
    // Sauberer Dateiname; ASCII-Fallback + UTF-8 (RFC 5987) für Umlaute
    const name = doc.downloadName;
    const asciiName = name.replace(/[^\x20-\x7E]/g, "_");
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(
          name
        )}`,
        // Privater Inhalt – nicht in geteilten Caches ablegen
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("Datei nicht gefunden.", { status: 404 });
  }
}
