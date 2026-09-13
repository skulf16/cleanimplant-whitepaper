// Einfaches In-Memory-Rate-Limit (pro Prozess/Container).
// Genügt für eine einzelne Coolify-Instanz – kein externer Dienst nötig.
// Zählt Treffer pro Schlüssel (z. B. IP) in einem gleitenden Zeitfenster.
// Beim Redeploy wird der Zähler zurückgesetzt; das ist unkritisch.

type Hits = number[];
const store = new Map<string, Hits>();
let lastSweep = Date.now();

function sweep(now: number, windowMs: number): void {
  // Gelegentlich alte Einträge ganz entfernen, damit die Map nicht wächst.
  if (now - lastSweep < windowMs) return;
  lastSweep = now;
  for (const [key, hits] of store) {
    const fresh = hits.filter((t) => now - t < windowMs);
    if (fresh.length === 0) store.delete(key);
    else store.set(key, fresh);
  }
}

/**
 * Prüft und registriert einen Zugriff für `key`.
 * @returns ok=false, wenn das Limit im Fenster erreicht ist (+ retryAfterSec).
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  sweep(now, windowMs);

  const hits = (store.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    const oldest = hits[0];
    const retryAfterSec = Math.max(
      1,
      Math.ceil((windowMs - (now - oldest)) / 1000)
    );
    store.set(key, hits);
    return { ok: false, retryAfterSec };
  }

  hits.push(now);
  store.set(key, hits);
  return { ok: true, retryAfterSec: 0 };
}
