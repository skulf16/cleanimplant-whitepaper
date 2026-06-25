import { NextRequest, NextResponse } from "next/server";
import { verifyMail } from "@/lib/mailer";
import { crTestSubscribe } from "@/lib/cleverreach";

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

  const smtp = await verifyMail();
  const cleverreach = runCr ? await crTestSubscribe(email) : "übersprungen (cr=0)";

  return NextResponse.json({ smtp, cleverreach });
}
