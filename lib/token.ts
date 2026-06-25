import crypto from "crypto";
import { DocumentId, isDocumentId } from "./documents";

// Signierte, ablaufende Download-Links (HMAC-SHA256, ohne Datenbank).
// Der Token kodiert nur die Dokument-ID + Ablaufzeit und ist signiert,
// damit er nicht gefälscht oder ratebar ist.

const DEFAULT_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 Tage

function getSecret(): string {
  const s = process.env.DOWNLOAD_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DOWNLOAD_SECRET ist nicht gesetzt – Download-Links können nicht signiert werden."
    );
  }
  // Nur für lokale Entwicklung
  return "dev-insecure-secret-change-me";
}

function sign(data: string): string {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function createDownloadToken(
  docId: DocumentId,
  ttlMs: number = DEFAULT_TTL_MS
): string {
  const payload = { d: docId, exp: Date.now() + ttlMs };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function verifyDownloadToken(token: string): DocumentId | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;

  const expected = sign(data);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    if (!isDocumentId(payload.d)) return null;
    return payload.d;
  } catch {
    return null;
  }
}

/** Baut die signierte, absolute Download-URL für ein Dokument. */
export function signedDownloadUrl(baseUrl: string, id: DocumentId): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/api/download?token=${createDownloadToken(id)}`;
}
