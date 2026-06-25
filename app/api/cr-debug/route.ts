import { NextRequest, NextResponse } from "next/server";
import { crDebug } from "@/lib/cleverreach";

export const runtime = "nodejs";

// Temporärer Diagnose-Endpoint: liefert CleverReach-Gruppen + Feld-Schlüssel.
// Nur erreichbar mit korrektem CR_DEBUG_TOKEN. Nach Gebrauch wieder entfernen.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const expected = process.env.CR_DEBUG_TOKEN;

  if (!expected || token !== expected) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const data = await crDebug();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
