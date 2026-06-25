import { headers } from "next/headers";
import { verifyConfirmToken, signedDownloadUrl } from "@/lib/token";
import { activateContact } from "@/lib/cleverreach";
import { DOCUMENTS } from "@/lib/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    return (
      <Shell>
        <div className="form-panel-header">
          <p>Bestätigung</p>
          <h2>Link ungültig oder abgelaufen</h2>
        </div>
        <div className="success-panel">
          <p>
            Dieser Bestätigungslink ist nicht (mehr) gültig. Bitte fordern Sie
            das Whitepaper erneut an.
          </p>
          <a href="/" className="btn-direct-download">
            Zurück zum Formular
          </a>
        </div>
      </Shell>
    );
  }

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
        <p>Bestätigt</p>
        <h2>Vielen Dank!</h2>
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
        <h3>Ihre E-Mail ist bestätigt.</h3>
        <p>Hier sind Ihre angeforderten Dokumente:</p>
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
