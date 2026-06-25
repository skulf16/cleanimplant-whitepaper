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

// ── Bestätigungs-Token (Double-Opt-in / E-Mail-Verifizierung) ──
// Kodiert die komplette Anfrage, damit nach dem Klick die richtigen
// Dokumente ausgeliefert und der Kontakt aktiviert werden kann.

const CONFIRM_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 Tage

export interface ConfirmPayload {
  email: string;
  documents: DocumentId[];
  newsletter: boolean;
  lang: "de" | "en";
}

export function createConfirmToken(
  p: ConfirmPayload,
  ttlMs: number = CONFIRM_TTL_MS
): string {
  const payload = {
    e: p.email,
    d: p.documents,
    n: p.newsletter,
    l: p.lang,
    exp: Date.now() + ttlMs,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function verifyConfirmToken(token: string): ConfirmPayload | null {
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
    const documents: DocumentId[] = Array.isArray(payload.d)
      ? payload.d.filter(isDocumentId)
      : [];
    if (typeof payload.e !== "string" || documents.length === 0) return null;
    return {
      email: payload.e,
      documents,
      newsletter: Boolean(payload.n),
      lang: payload.l === "en" ? "en" : "de",
    };
  } catch {
    return null;
  }
}
