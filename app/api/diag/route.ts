import { NextRequest, NextResponse } from "next/server";
import { verifyMail } from "@/lib/mailer";
import { crTestSubscribe, crLookupReceiver } from "@/lib/cleverreach";

export const runtime = "nodejs";

// Temporärer Diagnose-Endpoint: prüft SMTP + CleverReach Schritt für Schritt.
// Nur mit korrektem CR_DEBUG_TOKEN. Nach Gebrauch wieder entfernen.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!process.env.CR_DEBUG_TOKEN || token !== process.env.CR_DEBUG_TOKEN) {
    return new NextResponse("Not found", { status: 404 });
  }

  const email = req.nextUrl.searchParams.get("email") || "diag@example.com";
  const runCr = req.nextUrl.searchParams.get("cr") !== "0";

  // Status-Abfrage: ist diese Adresse in der Gruppe aktiv?
  const statusEmail = req.nextUrl.searchParams.get("status");
  if (statusEmail) {
    return NextResponse.json({ receiver: await crLookupReceiver(statusEmail) });
  }

  // Welche Variablen erreichen den Container? (nur Präsenz, keine Werte)
  const has = (k: string) => Boolean(process.env[k] && process.env[k]!.length);
  const env = {
    SMTP_HOST: has("SMTP_HOST"),
    SMTP_PORT: has("SMTP_PORT"),
    SMTP_USER: has("SMTP_USER"),
    SMTP_PASS: has("SMTP_PASS"),
    SMTP_FROM: has("SMTP_FROM"),
    DOWNLOAD_SECRET: has("DOWNLOAD_SECRET"),
    NEXT_PUBLIC_BASE_URL: has("NEXT_PUBLIC_BASE_URL"),
    CLEVERREACH_CLIENT_ID: has("CLEVERREACH_CLIENT_ID"),
    CLEVERREACH_CLIENT_SECRET: has("CLEVERREACH_CLIENT_SECRET"),
    CLEVERREACH_GROUP_ID: has("CLEVERREACH_GROUP_ID"),
    CLEVERREACH_FORM_ID: has("CLEVERREACH_FORM_ID"),
  };

  const smtp = await verifyMail();
  const cleverreach = runCr ? await crTestSubscribe(email) : "übersprungen (cr=0)";

  return NextResponse.json({ env, smtp, cleverreach });
}
