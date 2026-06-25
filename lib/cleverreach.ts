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

  // upsert
  try {
    const up = await fetch(`${API_BASE}/groups.json/${groupId}/receivers/upsert`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify([
        {
          email,
          source: "Diagnose",
          activated: 0,
          deactivated: 0,
          global_attributes: {
            language: lang === "en" ? "Englisch" : "Deutsch",
            quelle: "Diagnose",
          },
          attributes: { guideline: wantsGuideline ? "Ja" : "Nein" },
        },
      ]),
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

interface SubscribeArgs {
  email: string;
  /** Sprache des gewählten Whitepapers ("de" | "en") → Feld `language` */
  lang?: "de" | "en";
  /** Wurden die Guidelines mitbestellt? → Gruppen-Feld `guideline` (Ja/Nein) */
  wantsGuideline?: boolean;
  source?: string;
  /** Für den DOI-Einwilligungsnachweis */
  userIp?: string;
  userAgent?: string;
}

/**
 * Trägt eine Adresse in die CleverReach-Gruppe ein und stößt das
 * Double-Opt-in an. Existiert die Adresse bereits (und ist bestätigt),
 * passiert nichts Doppeltes – CleverReach verwaltet das selbst.
 *
 * Geschriebene Felder:
 *  - global `language`  → "Deutsch" / "Englisch"
 *  - global `quelle`    → Quelle der Anmeldung
 *  - group  `guideline` → "Ja" / "Nein"
 */
export async function subscribeToNewsletter({
  email,
  lang = "de",
  wantsGuideline = false,
  source = "Whitepaper Landingpage",
  userIp = "",
  userAgent = "",
}: SubscribeArgs): Promise<void> {
  if (!isCleverReachConfigured()) {
    console.warn(
      `[cleverreach] Nicht konfiguriert – Newsletter-Anmeldung für ${email} wird nicht übertragen.`
    );
    return;
  }

  // Optional getrennte Gruppen für DE/EN
  const groupId =
    (lang === "en" && process.env.CLEVERREACH_GROUP_ID_EN) ||
    process.env.CLEVERREACH_GROUP_ID;

  const token = await getAccessToken();
  const authHeader = { Authorization: `Bearer ${token}` };

  // 1. Empfänger in Gruppe anlegen/aktualisieren (noch nicht aktiv)
  const upsert = await fetch(
    `${API_BASE}/groups.json/${groupId}/receivers/upsert`,
    {
      method: "POST",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify([
        {
          email,
          source,
          // Als ausstehend anlegen (nicht aktiv) → ermöglicht den DOI-Versand.
          // Aktiv wird der Empfänger erst nach Klick in der Bestätigungsmail.
          activated: 0,
          deactivated: 0,
          // kontoweite Felder
          global_attributes: {
            language: lang === "en" ? "Englisch" : "Deutsch",
            quelle: source,
          },
          // gruppenspezifische Felder
          attributes: {
            guideline: wantsGuideline ? "Ja" : "Nein",
          },
        },
      ]),
    }
  );
  if (!upsert.ok) {
    throw new Error(`CleverReach upsert fehlgeschlagen (${upsert.status})`);
  }

  // 2. Double-Opt-in-Mail auslösen (sofern ein DOI-Formular hinterlegt ist)
  const formId =
    (lang === "en" && process.env.CLEVERREACH_FORM_ID_EN) ||
    process.env.CLEVERREACH_FORM_ID;

  if (formId) {
    const doi = await fetch(
      `${API_BASE}/forms.json/${formId}/send/activate`,
      {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          doidata: {
            user_ip: userIp,
            referer: source,
            user_agent: userAgent,
          },
        }),
      }
    );
    // "already active" ist kein echter Fehler: Adresse ist bereits bestätigt,
    // dann ist keine erneute DOI-Mail nötig.
    if (!doi.ok) {
      const body = await doi.json().catch(() => null);
      const msg = body?.error?.message || "";
      if (!/already active/i.test(msg)) {
        throw new Error(
          `CleverReach DOI-Versand fehlgeschlagen (${doi.status}): ${msg}`
        );
      }
    }
  }
}
