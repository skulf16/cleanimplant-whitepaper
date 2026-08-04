"use client";

import { Locale, T } from "@/lib/i18n";

export interface SuccessLink {
  label: string;
  url: string;
}

/**
 * Erfolgs-Zustand nach der Anmeldung: Danke-Text + direkte Download-Links.
 * Wird von der Danke-Seite genutzt und – falls die Weiterleitung dorthin nicht
 * möglich ist – als Fallback direkt im Formular-Panel der Landingpage.
 *
 * Rendert nur den Panel-Inhalt; den umgebenden `.form-panel-header` setzt die
 * jeweilige Seite selbst.
 */
export default function SuccessPanel({
  locale,
  links,
  email,
  confirmed,
  newsletter,
}: {
  locale: Locale;
  links: SuccessLink[];
  email: string;
  confirmed: boolean;
  newsletter: boolean;
}) {
  const t = T[locale];

  return (
    <>
      {confirmed ? (
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
          <h3>{t.thanksTitle}</h3>
          <p>{t.thanksText}</p>
          {newsletter && locale === "de" && (
            <p className="privacy-note" style={{ marginTop: 0 }}>
              {t.newsletterConfirmNote}
            </p>
          )}
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
      ) : (
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
              <path d="M4 4h16v16H4zM4 7l8 5 8-5" />
            </svg>
          </div>
          <h3>{t.almostTitle}</h3>
          <p>
            {t.almostBefore}
            <strong>{email}</strong>
            {t.almostAfter}
            <br />
            <br />
            {t.spamNote}
          </p>
        </div>
      )}
    </>
  );
}
