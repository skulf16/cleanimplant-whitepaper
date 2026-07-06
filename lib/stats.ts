import { promises as fs } from "fs";
import path from "path";
import { DocumentId, isDocumentId } from "./documents";

// Persistentes Verzeichnis (in Produktion auf ein Coolify-Volume mappen).
// Standard: <cwd>/data  → in Coolify Volume auf /app/data mounten.
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const LOG_FILE = path.join(DATA_DIR, "downloads.jsonl");

/** Zählt einen Download (ein Ereignis pro Zeile, JSONL). */
export async function recordDownload(docId: DocumentId): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.appendFile(
      LOG_FILE,
      JSON.stringify({ t: new Date().toISOString(), d: docId }) + "\n"
    );
  } catch (err) {
    // Zählung darf den Download nie blockieren
    console.error("[stats] recordDownload fehlgeschlagen:", err);
  }
}

export interface Stats {
  total: number;
  perDoc: Record<DocumentId, number>;
  perDay: { date: string; count: number }[];
  recent: { t: string; d: DocumentId }[];
}

/** Liest die Log-Datei und aggregiert die Download-Zahlen. */
export async function getStats(): Promise<Stats> {
  let content = "";
  try {
    content = await fs.readFile(LOG_FILE, "utf8");
  } catch {
    // Datei existiert noch nicht → alles 0
  }

  const perDoc: Record<DocumentId, number> = {
    whitepaper_de: 0,
    whitepaper_en: 0,
    guidelines: 0,
  };
  const perDayMap: Record<string, number> = {};
  const events: { t: string; d: DocumentId }[] = [];

  for (const line of content.split("\n")) {
    if (!line) continue;
    try {
      const e = JSON.parse(line);
      const d = e.d;
      if (isDocumentId(d)) {
        perDoc[d] += 1;
        const day = typeof e.t === "string" ? e.t.slice(0, 10) : "";
        if (day) perDayMap[day] = (perDayMap[day] || 0) + 1;
        events.push({ t: String(e.t), d });
      }
    } catch {
      // defekte Zeile überspringen
    }
  }

  const perDay = Object.entries(perDayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
  const recent = events.slice(-25).reverse();

  return { total: events.length, perDoc, perDay, recent };
}
