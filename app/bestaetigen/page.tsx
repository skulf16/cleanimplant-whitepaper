import { headers } from "next/headers";
import { verifyConfirmToken, signedDownloadUrl } from "@/lib/token";
import { activateContact } from "@/lib/cleverreach";
import { DOCUMENTS } from "@/lib/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONFIRM_STRINGS = {
  de: {
    invalidKicker: "Bestätigung",
    invalidTitle: "Link ungültig oder abgelaufen",
    invalidText:
      "Dieser Bestätigungslink ist nicht (mehr) gültig. Bitte fordern Sie das White Paper erneut an.",
    back: "Zurück zum Formular",
    okKicker: "Bestätigt",
    okTitle: "Vielen Dank!",
    okHead: "Ihre E-Mail ist bestätigt.",
    okText: "Hier sind Ihre angeforderten Dokumente:",
    home: "/",
  },
  en: {
    invalidKicker: "Confirmation",
    invalidTitle: "Link invalid or expired",
    invalidText:
      "This confirmation link is no longer valid. Please request the White Paper again.",
    back: "Back to the form",
    okKicker: "Confirmed",
    okTitle: "Thank you!",
    okHead: "Your email is confirmed.",
    okText: "Here are your requested documents:",
    home: "/en",
  },
} as const;

async function resolveBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return `${proto}://${host}`;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header>
        <a href="https://www.cleanimplant.com" className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cleanimplant-logo-positiv.svg"
            alt="CleanImplant Foundation"
            className="logo-img"
          />
        </a>
      </header>
      <main style={{ display: "block", maxWidth: 560 }}>
        <div className="form-panel">{children}</div>
      </main>
      <footer>
        <span className="footer-text">
          © 2026 CleanImplant Foundation · Pariser Platz 4a, 10117 Berlin
        </span>
        <a href="https://www.cleanimplant.org" target="_blank" rel="noopener">
          www.cleanimplant.org
        </a>
      </footer>
    </>
  );
}

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const payload = token ? verifyConfirmToken(token) : null;

  if (!payload) {
    const c = CONFIRM_STRINGS.de;
    return (
      <Shell>
        <div className="form-panel-header">
          <p>{c.invalidKicker}</p>
          <h2>{c.invalidTitle}</h2>
        </div>
        <div className="success-panel">
          <p>{c.invalidText}</p>
          <a href={c.home} className="btn-direct-download">
            {c.back}
          </a>
        </div>
      </Shell>
    );
  }

  const c = CONFIRM_STRINGS[payload.lang];

  // Kontakt in CleverReach aktivieren (Fehler nicht hart blockieren)
  try {
    await activateContact(payload.email);
  } catch (err) {
    console.error("[bestaetigen] Aktivierung fehlgeschlagen:", err);
  }

  const baseUrl = await resolveBaseUrl();
  const links = payload.documents.map((id) => ({
    label: DOCUMENTS[id].label,
    url: signedDownloadUrl(baseUrl, id),
  }));

  return (
    <Shell>
      <div className="form-panel-header">
        <p>{c.okKicker}</p>
        <h2>{c.okTitle}</h2>
      </div>
      <div className="success-panel">
        <div className="success-icon">
          <svg
            width="26"
            height="26"
            fill="none"
            viewBox="0 0 24 24"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3>{c.okHead}</h3>
        <p>{c.okText}</p>
        <div className="success-links">
          {links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              download
              className="btn-direct-download"
            >
              <svg
                width="15"
                height="15"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 3v12" />
              </svg>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </Shell>
  );
}
