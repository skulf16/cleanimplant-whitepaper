"use client";

import { useState } from "react";
import { Locale, T, GV } from "@/lib/i18n";

type DocId = "whitepaper_de" | "whitepaper_en" | "guidelines";
type Variant = "whitepaper" | "guideline";

interface SuccessLink {
  label: string;
  url: string;
}

export default function LandingPage({
  locale,
  variant = "whitepaper",
  paths = { de: "/", en: "/en" },
}: {
  locale: Locale;
  variant?: Variant;
  paths?: { de: string; en: string };
}) {
  const t = T[locale];
  const gv = GV[locale];
  const isGuideline = variant === "guideline";

  const DOC_SHORT: Record<DocId, string> = {
    whitepaper_de: t.wpDe,
    whitepaper_en: t.wpEn,
    guidelines: t.guidelineShort,
  };

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [docs, setDocs] = useState<Record<DocId, boolean>>({
    whitepaper_de: false,
    whitepaper_en: false,
    guidelines: isGuideline,
  });
  const [role, setRole] = useState<string>("");
  const [roleOther, setRoleOther] = useState("");
  const [newsletter, setNewsletter] = useState(false);

  const [emailError, setEmailError] = useState(false);
  const [docError, setDocError] = useState(false);
  const [roleError, setRoleError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    confirmed: boolean;
    links: SuccessLink[];
    email: string;
  } | null>(null);

  const isValidEmail = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const toggleDoc = (id: DocId) =>
    setDocs((prev) => ({ ...prev, [id]: !prev[id] }));

  const selectedDocIds = (Object.keys(docs) as DocId[]).filter((d) => docs[d]);
  const roleValue = role === "other" ? roleOther.trim() : role;

  // Pflicht-Auswahl je nach Variante
  const primarySelected = isGuideline
    ? docs.guidelines
    : docs.whitepaper_de || docs.whitepaper_en;
  const primaryError = isGuideline ? gv.guidelineError : t.langError;

  function goToStep2() {
    setDocError(!primarySelected);
    if (!primarySelected) return;
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const emailOk = isValidEmail(email);
    const hasRole = roleValue.length > 0;

    setEmailError(!emailOk);
    setRoleError(!hasRole);
    if (!primarySelected) {
      setDocError(true);
      setStep(1);
      return;
    }
    if (!emailOk || !hasRole) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/anmeldung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          documents: selectedDocIds,
          roles: [roleValue],
          newsletter,
          locale,
          source:
            typeof document !== "undefined"
              ? document.referrer || "direct"
              : "direct",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.genericError);
      }

      const data = await res.json();
      setSuccess({
        confirmed: data.confirmed !== false,
        links: data.links ?? [],
        email: email.trim(),
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  const renderCover = (
    id: DocId,
    src: string,
    alt: string,
    caption: string
  ) => (
    <button
      key={id}
      type="button"
      className={`cover-figure${docs[id] ? " selected" : ""}`}
      onClick={() => toggleDoc(id)}
      aria-pressed={docs[id]}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} />
      <span className="cover-caption">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {docs[id] ? <path d="M5 13l4 4L19 7" /> : <path d="M12 5v14M5 12h14" />}
        </svg>
        {caption}
      </span>
    </button>
  );

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

      {/* Main */}
      <main>
        {/* Left: document preview */}
        <div className="doc-preview">
          <p className="eyebrow">{t.eyebrow}</p>

          {isGuideline ? (
            <>
              {/* Guideline als großer blauer Kasten mit Beschreibung – oben */}
              <button
                type="button"
                className={`guideline-promo guideline-promo-lg${docs.guidelines ? " selected" : ""}`}
                onClick={() => toggleDoc("guidelines")}
                aria-pressed={docs.guidelines}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/guideline-cover.png"
                  alt="CleanImplant Guideline (Revision 2025)"
                  className="guideline-promo-cover"
                />
                <span className="guideline-promo-body">
                  <strong className="guideline-promo-title">
                    {t.guidelineTitle}
                  </strong>
                  <span className="guideline-promo-text">{t.guidelineText}</span>
                  <span className="guideline-promo-meta">{t.guidelineMeta}</span>
                  <span className="guideline-promo-action">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {docs.guidelines ? (
                        <path d="M5 13l4 4L19 7" />
                      ) : (
                        <path d="M12 5v14M5 12h14" />
                      )}
                    </svg>
                    {docs.guidelines ? t.selected : t.add}
                  </span>
                </span>
              </button>

              {/* Darunter: beide White Paper (DE / EN) */}
              <div className="covers-row">
                {renderCover(
                  "whitepaper_de",
                  "/whitepaper-de-cover.png",
                  "CleanImplant White Paper (Deutsch)",
                  t.coverDe
                )}
                {renderCover(
                  "whitepaper_en",
                  "/whitepaper-en-cover.png",
                  "CleanImplant White Paper (English)",
                  t.coverEn
                )}
              </div>
            </>
          ) : (
            <>
              <h1>
                {t.h1a}
                <br />
                <em>{t.h1em}</em>
              </h1>

              <p className="subtitle">{t.subtitle}</p>

              <div className="covers-row">
                {renderCover(
                  "whitepaper_de",
                  "/whitepaper-de-cover.png",
                  "CleanImplant White Paper (Deutsch)",
                  t.coverDe
                )}
                {renderCover(
                  "whitepaper_en",
                  "/whitepaper-en-cover.png",
                  "CleanImplant White Paper (English)",
                  t.coverEn
                )}
              </div>

              {/* Guideline-Banner (klickbar, synchron mit der Auswahl) */}
              <button
                type="button"
                className={`guideline-promo${docs.guidelines ? " selected" : ""}`}
                onClick={() => toggleDoc("guidelines")}
                aria-pressed={docs.guidelines}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/guideline-cover.png"
                  alt="CleanImplant Guideline (Revision 2025)"
                  className="guideline-promo-cover"
                />
                <span className="guideline-promo-body">
                  <strong className="guideline-promo-title">
                    {t.guidelineTitle}
                  </strong>
                  <span className="guideline-promo-text">{t.guidelineText}</span>
                  <span className="guideline-promo-meta">{t.guidelineMeta}</span>
                  <span className="guideline-promo-action">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {docs.guidelines ? (
                        <path d="M5 13l4 4L19 7" />
                      ) : (
                        <path d="M12 5v14M5 12h14" />
                      )}
                    </svg>
                    {docs.guidelines ? t.selected : t.add}
                  </span>
                </span>
              </button>
            </>
          )}
        </div>

        {/* Right: form */}
        <div className="form-panel">
          <div className="form-panel-header">
            {!success ? (
              <>
                <p>{step === 1 ? t.step1kicker : t.step2kicker}</p>
                <h2>{step === 1 ? t.step1title : t.step2title}</h2>
                <div className="step-bar">
                  <span className="step-seg active" />
                  <span className={`step-seg${step >= 2 ? " active" : ""}`} />
                </div>
              </>
            ) : (
              <>
                <p>{t.doneKicker}</p>
                <h2>{t.doneTitle}</h2>
              </>
            )}
          </div>

          {!success ? (
            <div className="form-body">
              <form onSubmit={handleSubmit} noValidate>
                {/* Step 1: selection */}
                {step === 1 && (
                  <>
                    {isGuideline ? (
                      <>
                        {/* Primary: guideline */}
                        <div className="field-group">
                          <span className="field-label">
                            {gv.primaryLabel} <span className="required">*</span>
                          </span>
                          <div className="options-group">
                            <label
                              className={`option-item${docs.guidelines ? " selected" : ""}`}
                            >
                              <input
                                type="checkbox"
                                checked={docs.guidelines}
                                onChange={() => toggleDoc("guidelines")}
                              />
                              <span className="option-label">
                                {t.guidelineTitle}
                              </span>
                            </label>
                          </div>
                          {docError && (
                            <p className="error-msg visible">{primaryError}</p>
                          )}
                        </div>

                        {/* Add-on: white paper languages */}
                        <div className="field-group">
                          <span className="field-label">
                            {gv.addonLabel}
                            <span className="optional">{t.optional}</span>
                          </span>
                          <div className="options-group">
                            <label
                              className={`option-item${docs.whitepaper_de ? " selected" : ""}`}
                            >
                              <input
                                type="checkbox"
                                checked={docs.whitepaper_de}
                                onChange={() => toggleDoc("whitepaper_de")}
                              />
                              <span className="option-label">{t.wpDe}</span>
                              <span className="option-flag">DE</span>
                            </label>
                            <label
                              className={`option-item${docs.whitepaper_en ? " selected" : ""}`}
                            >
                              <input
                                type="checkbox"
                                checked={docs.whitepaper_en}
                                onChange={() => toggleDoc("whitepaper_en")}
                              />
                              <span className="option-label">{t.wpEn}</span>
                              <span className="option-flag">EN</span>
                            </label>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="field-group">
                          <span className="field-label">
                            {t.selectionLabel}{" "}
                            <span className="required">*</span>
                          </span>
                          <div className="options-group">
                            <label
                              className={`option-item${docs.whitepaper_de ? " selected" : ""}`}
                            >
                              <input
                                type="checkbox"
                                checked={docs.whitepaper_de}
                                onChange={() => toggleDoc("whitepaper_de")}
                              />
                              <span className="option-label">{t.wpDe}</span>
                              <span className="option-flag">DE</span>
                            </label>
                            <label
                              className={`option-item${docs.whitepaper_en ? " selected" : ""}`}
                            >
                              <input
                                type="checkbox"
                                checked={docs.whitepaper_en}
                                onChange={() => toggleDoc("whitepaper_en")}
                              />
                              <span className="option-label">{t.wpEn}</span>
                              <span className="option-flag">EN</span>
                            </label>
                          </div>
                          {docError && (
                            <p className="error-msg visible">{primaryError}</p>
                          )}
                        </div>

                        {/* Guideline CTA */}
                        <div className="field-group">
                          <label
                            className={`cta-item${docs.guidelines ? " selected" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={docs.guidelines}
                              onChange={() => toggleDoc("guidelines")}
                            />
                            <span className="cta-label">
                              <strong>{t.guidelineCtaTitle}</strong>
                              {t.guidelineCtaText}
                            </span>
                          </label>
                        </div>
                      </>
                    )}

                    <button
                      type="button"
                      className="btn-download"
                      onClick={goToStep2}
                    >
                      {t.next}
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Step 2: details */}
                {step === 2 && (
                  <>
                    <div className="selection-summary">
                      <span>
                        {selectedDocIds.map((d) => DOC_SHORT[d]).join(" · ")}
                      </span>
                      <button
                        type="button"
                        className="summary-edit"
                        onClick={() => setStep(1)}
                      >
                        {t.change}
                      </button>
                    </div>

                    <div className="field-group">
                      <label className="field-label" htmlFor="email">
                        {t.emailLabel} <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder={t.emailPlaceholder}
                        autoComplete="email"
                        className={emailError ? "error" : ""}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      {emailError && (
                        <p className="error-msg visible">{t.emailError}</p>
                      )}
                    </div>

                    <div className="field-group">
                      <span className="field-label">
                        {t.roleLabel} <span className="required">*</span>
                      </span>
                      <div className="options-group">
                        {[
                          ["dentist", t.roleDentist],
                          ["patient", t.rolePatient],
                          ["industry", t.roleIndustry],
                          ["other", t.roleOther],
                        ].map(([value, label]) => (
                          <label
                            key={value}
                            className={`option-item${role === value ? " selected" : ""}`}
                          >
                            <input
                              type="radio"
                              name="role"
                              checked={role === value}
                              onChange={() => setRole(value)}
                            />
                            <span className="option-label">{label}</span>
                          </label>
                        ))}
                      </div>
                      {role === "other" && (
                        <input
                          type="text"
                          className="role-other-input"
                          placeholder={t.roleOtherPlaceholder}
                          value={roleOther}
                          onChange={(e) => setRoleOther(e.target.value)}
                          autoFocus
                        />
                      )}
                      {roleError && (
                        <p className="error-msg visible">
                          {role === "other" ? t.roleErrorOther : t.roleErrorSelect}
                        </p>
                      )}
                    </div>

                    <div className="field-group">
                      <span className="field-label">
                        {t.newsletterLabel}
                        <span className="optional">{t.optional}</span>
                      </span>
                      <label className="newsletter-item">
                        <input
                          type="checkbox"
                          checked={newsletter}
                          onChange={() => setNewsletter((v) => !v)}
                        />
                        <span className="newsletter-label">
                          <strong>{t.newsletterStrong}</strong>
                          {t.newsletterText}
                        </span>
                      </label>
                    </div>

                    {submitError && (
                      <p
                        className="error-msg visible"
                        style={{ textAlign: "center" }}
                      >
                        {submitError}
                      </p>
                    )}

                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-back"
                        onClick={() => setStep(1)}
                        disabled={submitting}
                      >
                        {t.back}
                      </button>
                      <button
                        type="submit"
                        className="btn-download"
                        disabled={submitting}
                      >
                        {!submitting && (
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 3v12" />
                          </svg>
                        )}
                        {submitting ? t.submitting : t.submit}
                      </button>
                    </div>

                    <p className="privacy-note">
                      {t.privacy}
                      <br />
                      <a href="/datenschutz" target="_blank">
                        {t.privacyLink}
                      </a>
                    </p>
                  </>
                )}
              </form>
            </div>
          ) : success.confirmed ? (
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
              <div className="success-links">
                {success.links.map((link) => (
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
                <strong>{success.email}</strong>
                {t.almostAfter}
                <br />
                <br />
                {t.spamNote}
              </p>
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
