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
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.CLEVERREACH_CLIENT_ID || "",
      client_secret: process.env.CLEVERREACH_CLIENT_SECRET || "",
    }),
  });
  if (!res.ok) {
    throw new Error(`CleverReach Auth fehlgeschlagen (${res.status})`);
  }
  const data = await res.json();
  return data.access_token as string;
}

interface SubscribeArgs {
  email: string;
  /** Sprache steuert ggf. die DOI-Mail/Gruppe ("de" | "en") */
  lang?: "de" | "en";
  /** Beliebige zusätzliche Felder (global attributes) */
  attributes?: Record<string, string>;
  source?: string;
}

/**
 * Trägt eine Adresse in die CleverReach-Gruppe ein und stößt das
 * Double-Opt-in an. Existiert die Adresse bereits (und ist bestätigt),
 * passiert nichts Doppeltes – CleverReach verwaltet das selbst.
 */
export async function subscribeToNewsletter({
  email,
  lang = "de",
  attributes = {},
  source = "whitepaper-landingpage",
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
          attributes,
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
            user_ip: attributes.user_ip || "",
            referer: source,
            user_agent: attributes.user_agent || "",
          },
        }),
      }
    );
    if (!doi.ok) {
      throw new Error(`CleverReach DOI-Versand fehlgeschlagen (${doi.status})`);
    }
  }
}
