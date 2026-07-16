// CleverReach-Anbindung über die REST-API v3.
// Authentifizierung per OAuth Client-Credentials (Client ID + Secret).
// Newsletter-Anmeldungen werden in eine Gruppe geschrieben; das Double-Opt-in
// übernimmt CleverReach über ein hinterlegtes DOI-Formular.

export function isCleverReachConfigured(): boolean {
  return Boolean(
    process.env.CLEVERREACH_CLIENT_ID &&
      process.env.CLEVERREACH_CLIENT_SECRET &&
      process.env.CLEVERREACH_GROUP_ID
  );
}

const API_BASE = "https://rest.cleverreach.com/v3";
// OAuth-Token-Endpunkt liegt auf Root-Ebene, NICHT unter /v3
const TOKEN_URL = "https://rest.cleverreach.com/oauth/token.php";

async function getAccessToken(): Promise<string> {
  // CleverReach erwartet client_id/secret per HTTP-Basic-Auth, grant_type im Body
  const basic = Buffer.from(
    `${process.env.CLEVERREACH_CLIENT_ID}:${process.env.CLEVERREACH_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  if (!res.ok) {
    throw new Error(`CleverReach Auth fehlgeschlagen (${res.status})`);
  }
  const data = await res.json();
  return data.access_token as string;
}

/**
 * Diagnose: führt die komplette Newsletter-Kette aus und gibt jeden Schritt
 * mit HTTP-Status + Antwort zurück. Nur für den geschützten Test-Endpoint.
 */
export async function crTestSubscribe(
  email: string,
  lang: "de" | "en" = "de",
  wantsGuideline = true
): Promise<unknown> {
  const out: Record<string, unknown> = {
    configured: {
      groupId: process.env.CLEVERREACH_GROUP_ID ?? null,
      formId: process.env.CLEVERREACH_FORM_ID ?? null,
    },
  };

  let token: string;
  try {
    token = await getAccessToken();
    out.token = { ok: true };
  } catch (e) {
    out.token = { ok: false, error: String(e) };
    return out;
  }
  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const groupId = process.env.CLEVERREACH_GROUP_ID;
  const formId = process.env.CLEVERREACH_FORM_ID;

  // create (als ausstehend)
  try {
    const up = await fetch(`${API_BASE}/groups.json/${groupId}/receivers`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({
        email,
        registered: Math.floor(Date.now() / 1000),
        activated: 0,
        deactivated: 0,
        source: "Diagnose",
        global_attributes: {
          language: lang === "en" ? "Englisch" : "Deutsch",
          quelle: "Diagnose",
        },
        attributes: { guideline: wantsGuideline ? "Ja" : "Nein" },
      }),
    });
    out.upsert = { status: up.status, body: await up.json().catch(() => null) };
  } catch (e) {
    out.upsert = { error: String(e) };
  }

  // DOI
  try {
    const doi = await fetch(`${API_BASE}/forms.json/${formId}/send/activate`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({
        email,
        doidata: { user_ip: "127.0.0.1", referer: "Diagnose", user_agent: "diag" },
      }),
    });
    out.doi = { status: doi.status, body: await doi.json().catch(() => null) };
  } catch (e) {
    out.doi = { error: String(e) };
  }

  return out;
}

async function authedHeaders() {
  const token = await getAccessToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Prüft, ob die Adresse in der Gruppe bereits ein aktiver (bestätigter)
 * Empfänger ist. Bestandskontakte bekommen so den Download sofort.
 * Der Gruppen-Endpoint liefert ein verlässliches `active`-Flag.
 */
export async function isContactActive(email: string): Promise<boolean> {
  if (!isCleverReachConfigured()) return false;
  try {
    const groupId = process.env.CLEVERREACH_GROUP_ID;
    const headers = await authedHeaders();
    const res = await fetch(
      `${API_BASE}/groups.json/${groupId}/receivers/${encodeURIComponent(email)}`,
      { headers }
    );
    if (!res.ok) return false; // 404 = nicht in der Gruppe
    const d = await res.json();
    if (d?.active === true) return true;
    return Number(d?.activated) > 0 && Number(d?.deactivated) === 0;
  } catch {
    return false;
  }
}

/** Diagnose: roher Empfänger-Status in der Gruppe. */
export async function crLookupReceiver(email: string): Promise<unknown> {
  if (!isCleverReachConfigured()) return { error: "nicht konfiguriert" };
  try {
    const groupId = process.env.CLEVERREACH_GROUP_ID;
    const headers = await authedHeaders();
    const res = await fetch(
      `${API_BASE}/groups.json/${groupId}/receivers/${encodeURIComponent(email)}`,
      { headers }
    );
    const body = await res.json().catch(() => null);
    return { status: res.status, active: await isContactActive(email), body };
  } catch (e) {
    return { error: String(e) };
  }
}

interface PendingArgs {
  email: string;
  lang?: "de" | "en";
  wantsGuideline?: boolean;
  newsletter?: boolean;
  /** Berufsgruppe(n) → Feld `profession` */
  profession?: string;
  source?: string;
}

/**
 * Legt den Kontakt in der Gruppe als AUSSTEHEND (activated:0) an.
 * Aktiviert wird er erst nach Klick auf den Bestätigungslink (activateContact).
 * Kein CleverReach-DOI – die Bestätigung läuft über unsere eigene Mail/Seite.
 */
export async function addContactPending({
  email,
  lang = "de",
  wantsGuideline = false,
  newsletter = false,
  profession = "",
  source = "White Paper Landingpage",
}: PendingArgs): Promise<void> {
  if (!isCleverReachConfigured()) {
    console.warn(`[cleverreach] Nicht konfiguriert – ${email} nicht übertragen.`);
    return;
  }
  const groupId = process.env.CLEVERREACH_GROUP_ID;
  const headers = await authedHeaders();
  const res = await fetch(`${API_BASE}/groups.json/${groupId}/receivers`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      registered: Math.floor(Date.now() / 1000),
      activated: 0,
      deactivated: 0,
      source,
      global_attributes: {
        language: lang === "en" ? "Englisch" : "Deutsch",
        newsletter: newsletter ? "Ja" : "Nein",
        profession,
        quelle: source,
      },
      attributes: { guideline: wantsGuideline ? "Ja" : "Nein" },
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = body?.error?.message || "";
    // Duplikat ist ok (Adresse existiert bereits)
    if (!/duplicate|already|exist/i.test(msg)) {
      throw new Error(`CleverReach Eintrag fehlgeschlagen (${res.status}): ${msg}`);
    }
  }
}

/**
 * Aktiviert (bestätigt) den Kontakt nach Klick auf den Bestätigungslink.
 */
export async function activateContact(email: string): Promise<void> {
  if (!isCleverReachConfigured()) return;
  const groupId = process.env.CLEVERREACH_GROUP_ID;
  const headers = await authedHeaders();
  const res = await fetch(
    `${API_BASE}/groups.json/${groupId}/receivers/${encodeURIComponent(
      email
    )}/activate`,
    { method: "PUT", headers, body: "{}" }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = body?.error?.message || "";
    if (!/already active/i.test(msg)) {
      throw new Error(
        `CleverReach Aktivierung fehlgeschlagen (${res.status}): ${msg}`
      );
    }
  }
}

interface SubscribeArgs {
  email: string;
  /** Sprache → steuert Single-/Double-Opt-in und Feld `language` */
  lang?: "de" | "en";
  /** Wurden die Guidelines mitbestellt? → Gruppen-Feld `guideline` (Ja/Nein) */
  wantsGuideline?: boolean;
  /** Berufsgruppe → global `profession` */
  profession?: string;
  /** Name (nur bei Newsletter) → global `firstname` / `lastname` */
  firstName?: string;
  lastName?: string;
  source?: string;
  /** Für den DOI-Einwilligungsnachweis (nur Deutsch) */
  userIp?: string;
  userAgent?: string;
}

/**
 * Newsletter-Anmeldung in CleverReach.
 *  - Deutsch: Double-Opt-in (Empfänger ausstehend + CleverReach-DOI-Mail).
 *  - Englisch: Single-Opt-in (Empfänger direkt aktiv, keine Bestätigungsmail).
 * Wird nur aufgerufen, wenn der Newsletter aktiv gewünscht wurde.
 */
export async function subscribeToNewsletter({
  email,
  lang = "de",
  wantsGuideline = false,
  profession = "",
  firstName = "",
  lastName = "",
  source = "White Paper Landingpage",
  userIp = "",
  userAgent = "",
}: SubscribeArgs): Promise<void> {
  if (!isCleverReachConfigured()) {
    console.warn(
      `[cleverreach] Nicht konfiguriert – Newsletter-Anmeldung für ${email} wird nicht übertragen.`
    );
    return;
  }

  const singleOptIn = lang === "en";
  const groupId =
    (lang === "en" && process.env.CLEVERREACH_GROUP_ID_EN) ||
    process.env.CLEVERREACH_GROUP_ID;

  const token = await getAccessToken();
  const authHeader = { Authorization: `Bearer ${token}` };
  const now = Math.floor(Date.now() / 1000);

  // 1. Empfänger anlegen – EN: sofort aktiv (Single-Opt-in), DE: ausstehend (DOI folgt)
  const create = await fetch(`${API_BASE}/groups.json/${groupId}/receivers`, {
    method: "POST",
    headers: { ...authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      registered: now,
      activated: singleOptIn ? now : 0,
      deactivated: 0,
      source,
      global_attributes: {
        language: lang === "en" ? "Englisch" : "Deutsch",
        newsletter: "Ja",
        firstname: firstName,
        lastname: lastName,
        profession,
        quelle: source,
      },
      attributes: { guideline: wantsGuideline ? "Ja" : "Nein" },
    }),
  });
  const duplicate = !create.ok;
  if (duplicate) {
    const body = await create.json().catch(() => null);
    const msg = body?.error?.message || "";
    if (!/duplicate|already|exist/i.test(msg)) {
      throw new Error(
        `CleverReach Eintrag fehlgeschlagen (${create.status}): ${msg}`
      );
    }
  }

  if (singleOptIn) {
    // Englisch: sicherstellen, dass der Kontakt aktiv ist (auch bei Duplikat)
    if (duplicate) await activateContact(email);
    return;
  }

  // Deutsch: Double-Opt-in-Mail über das hinterlegte Formular auslösen
  const formId = process.env.CLEVERREACH_FORM_ID;
  if (!formId) return;
  const doi = await fetch(`${API_BASE}/forms.json/${formId}/send/activate`, {
    method: "POST",
    headers: { ...authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      doidata: { user_ip: userIp, referer: source, user_agent: userAgent },
    }),
  });
  if (!doi.ok) {
    const body = await doi.json().catch(() => null);
    const msg = body?.error?.message || "";
    // "already active" ist ok (bereits bestätigt)
    if (!/already active/i.test(msg)) {
      throw new Error(
        `CleverReach DOI-Versand fehlgeschlagen (${doi.status}): ${msg}`
      );
    }
  }
}
