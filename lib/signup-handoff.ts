import type { Locale } from "./i18n";
import type { SuccessLink } from "@/components/SuccessPanel";

/**
 * Übergabe der Anmeldedaten von der Landingpage an die Danke-Seite.
 *
 * Bewusst über sessionStorage und NICHT über Query-Parameter:
 * die URL der Danke-Seite geht als PageView an Meta und als Referer an Dritte
 * (z. B. Google Fonts). E-Mail-Adresse und die signierten Download-Links dürfen
 * dort nicht landen. Zusätzlich würden Dokument-IDs in der URL die E-Mail-Hürde
 * aushebeln – jeder könnte sich ohne Anmeldung Download-Links erzeugen lassen.
 */

const KEY = "cleanimplant:signup";
const LEAD_KEY = "cleanimplant:signup:lead-tracked";

/** Nach dieser Zeit gilt eine Anmeldung als abgelaufen (Tab blieb lange offen). */
const MAX_AGE_MS = 30 * 60 * 1000;

export interface SignupHandoff {
  links: SuccessLink[];
  email: string;
  confirmed: boolean;
  newsletter: boolean;
  locale: Locale;
  /** Dokument-IDs – nur für die Event-Parameter des Lead-Trackings. */
  documents: string[];
  ts: number;
}

/** Schreibt die Anmeldedaten. Gibt false zurück, wenn sessionStorage blockiert ist. */
export function writeHandoff(data: Omit<SignupHandoff, "ts">): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.sessionStorage.setItem(
      KEY,
      JSON.stringify({ ...data, ts: Date.now() } satisfies SignupHandoff),
    );
    window.sessionStorage.removeItem(LEAD_KEY);
    return true;
  } catch {
    // Private-Mode / Storage voll / Storage per Policy deaktiviert
    return false;
  }
}

/** Liest die Anmeldedaten. null = Danke-Seite wurde direkt aufgerufen. */
export function readHandoff(): SignupHandoff | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SignupHandoff;
    if (typeof data.ts !== "number" || Date.now() - data.ts > MAX_AGE_MS) {
      window.sessionStorage.removeItem(KEY);
      return null;
    }
    if (!Array.isArray(data.links)) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Einmal-Sperre für das Lead-Event: verhindert Doppelzählung bei Reload der
 * Danke-Seite. Gibt true zurück, wenn jetzt getrackt werden darf.
 */
export function claimLeadTracking(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(LEAD_KEY)) return false;
    window.sessionStorage.setItem(LEAD_KEY, "1");
    return true;
  } catch {
    return false;
  }
}
