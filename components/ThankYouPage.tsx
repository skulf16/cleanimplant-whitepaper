"use client";

import { useEffect, useState } from "react";
import { Locale, T } from "@/lib/i18n";
import SuccessPanel from "@/components/SuccessPanel";
import {
  claimLeadTracking,
  readHandoff,
  type SignupHandoff,
} from "@/lib/signup-handoff";

export default function ThankYouPage({
  locale,
  paths,
  formPath,
}: {
  locale: Locale;
  paths: { de: string; en: string };
  formPath: string;
}) {
  const t = T[locale];
  const [handoff, setHandoff] = useState<SignupHandoff | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const data = readHandoff();
    setHandoff(data);
    setReady(true);

    // Meta Pixel: Lead. Drei Bedingungen, alle nötig:
    if (!data) return; // 1. Seite wurde direkt aufgerufen, keine echte Anmeldung
    const fbq = (window as { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof fbq !== "function") return; // 2. Cookiebot blockt (keine Marketing-Einwilligung)
    if (!claimLeadTracking()) return; // 3. bei Reload nicht doppelt zählen

    fbq("track", "Lead", {
      content_name: data.documents.join(","),
      content_category: data.locale,
    });
  }, []);

  return (
    <>
      {/* Header */}
      <header>
        <a href="https://www.cleanimplant.com" className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cleanimplant-logo-positiv.svg"
            alt="CleanImplant Foundation"
            className="logo-img"
          />
        </a>
        <nav className="lang-switch">
          <a href={paths.de} className={locale === "de" ? "active" : ""}>
            {t.langNav.de}
          </a>
          <a href={paths.en} className={locale === "en" ? "active" : ""}>
            {t.langNav.en}
          </a>
        </nav>
      </header>

      <main className="main-single">
        <div className="form-panel">
          <div className="form-panel-header">
            <p>{t.doneKicker}</p>
            <h2>{t.doneTitle}</h2>
          </div>

          {!ready ? null : handoff ? (
            <SuccessPanel
              locale={locale}
              links={handoff.links}
              email={handoff.email}
              confirmed={handoff.confirmed}
              newsletter={handoff.newsletter}
            />
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
              <h3>{t.thanksDirectTitle}</h3>
              <p>{t.thanksDirectText}</p>
              <div className="success-links">
                <a href={formPath} className="btn-direct-download">
                  {t.thanksDirectCta}
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
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
