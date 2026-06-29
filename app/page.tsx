"use client";

import { useState } from "react";

type DocId = "whitepaper_de" | "whitepaper_en" | "guidelines";

const DOC_LABELS: Record<DocId, string> = {
  whitepaper_de: "White Paper Deutsch",
  whitepaper_en: "White Paper English",
  guidelines: "Guidelines",
};

interface SuccessLink {
  label: string;
  url: string;
}

export default function Home() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [docs, setDocs] = useState<Record<DocId, boolean>>({
    whitepaper_de: false,
    whitepaper_en: false,
    guidelines: false,
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

  // Gewählte Berufsgruppe als Klartext (bei „Sonstiges" der eingegebene Wert)
  const roleValue = role === "other" ? roleOther.trim() : role;

  // Schritt 1 → 2: mindestens ein Whitepaper muss gewählt sein
  function goToStep2() {
    const hasWhitepaper = docs.whitepaper_de || docs.whitepaper_en;
    setDocError(!hasWhitepaper);
    if (!hasWhitepaper) return;
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const emailOk = isValidEmail(email);
    const hasWhitepaper = docs.whitepaper_de || docs.whitepaper_en;
    const hasRole = roleValue.length > 0;

    setEmailError(!emailOk);
    setRoleError(!hasRole);
    if (!hasWhitepaper) {
      // Sicherheitsnetz: zurück zu Schritt 1
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
          source:
            typeof document !== "undefined"
              ? document.referrer || "direct"
              : "direct",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Es ist ein Fehler aufgetreten.");
      }

      const data = await res.json();
      setSuccess({
        confirmed: data.confirmed !== false,
        links: data.links ?? [],
        email: email.trim(),
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut."
      );
    } finally {
      setSubmitting(false);
    }
  }

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
      </header>

      {/* Main */}
      <main>
        {/* Left: document preview */}
        <div className="doc-preview">
          <p className="eyebrow">CleanImplant Sonder-Publikationen</p>

          <h1>
            Peri-implantitis und der
            <br />
            <em>übersehene Risikofaktor</em>
          </h1>

          <p className="subtitle">
            White Paper zu klinischen und wirtschaftlichen Implikationen für
            Zahnärztinnen und Zahnärzte, für implantologische und
            implantatprothetische Praxen und Überweiser.
          </p>

          <div className="covers-row">
            <figure className="cover-figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/whitepaper-de-cover.png"
                alt="CleanImplant White Paper (Deutsch)"
              />
              <figcaption>Deutsch</figcaption>
            </figure>
            <figure className="cover-figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/whitepaper-en-cover.png"
                alt="CleanImplant White Paper (English)"
              />
              <figcaption>English</figcaption>
            </figure>
          </div>

          {/* Guideline-Banner – unter dem Whitepaper, klickbar (synchron mit Auswahl) */}
          <button
            type="button"
            className={`guideline-promo${docs.guidelines ? " selected" : ""}`}
            onClick={() => toggleDoc("guidelines")}
            aria-pressed={docs.guidelines}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/guideline-cover.png"
              alt="CleanImplant Quality Guidelines"
              className="guideline-promo-cover"
            />
            <span className="guideline-promo-body">
              <strong className="guideline-promo-title">
                CleanImplant Guideline für saubere Dentalimplantate
              </strong>
              <span className="guideline-promo-text">
                Verfahrensbeschreibung und Leistungskriterien für das
                CleanImplant Trusted Quality Seal
              </span>
              <span className="guideline-promo-meta">
                Vollständige konsensbasierte Leitlinie · überarbeitet 2025 ·
                28 Seiten, 50 REM-Aufnahmen
              </span>
              <span className="guideline-promo-action">
                {docs.guidelines ? (
                  <>
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
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    Ausgewählt
                  </>
                ) : (
                  <>
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
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Hinzufügen
                  </>
                )}
              </span>
            </span>
          </button>
        </div>

        {/* Right: form */}
        <div className="form-panel">
          <div className="form-panel-header">
            {!success ? (
              <>
                <p>
                  {step === 1
                    ? "Schritt 1 von 2 · Auswahl"
                    : "Schritt 2 von 2 · Ihre Daten"}
                </p>
                <h2>
                  {step === 1
                    ? "Welche Dokumente möchten Sie?"
                    : "Wohin dürfen wir senden?"}
                </h2>
                <div className="step-bar">
                  <span className="step-seg active" />
                  <span className={`step-seg${step >= 2 ? " active" : ""}`} />
                </div>
              </>
            ) : (
              <>
                <p>Geschafft</p>
                <h2>Ihre Downloads</h2>
              </>
            )}
          </div>

          {!success ? (
            <div className="form-body">
              <form onSubmit={handleSubmit} noValidate>
                {/* ─── Schritt 1: Auswahl ─── */}
                {step === 1 && (
                  <>
                    <div className="field-group">
                      <span className="field-label">
                        Sprache auswählen <span className="required">*</span>
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
                          <span className="option-label">White Paper Deutsch</span>
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
                          <span className="option-label">White Paper English</span>
                          <span className="option-flag">EN</span>
                        </label>
                      </div>
                      {docError && (
                        <p className="error-msg visible">
                          Bitte wählen Sie mindestens eine Sprache.
                        </p>
                      )}
                    </div>

                    {/* Guidelines CTA */}
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
                          <strong>CleanImplant Guideline (Revision 2025)</strong>
                          Senden Sie mir zusätzlich die aktuelle
                          CleanImplant-Leitlinie mit Leistungskriterien für
                          saubere Implantate (PDF in Englisch).
                        </span>
                      </label>
                    </div>

                    <button
                      type="button"
                      className="btn-download"
                      onClick={goToStep2}
                    >
                      Weiter
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

                {/* ─── Schritt 2: Daten ─── */}
                {step === 2 && (
                  <>
                    {/* Auswahl-Zusammenfassung */}
                    <div className="selection-summary">
                      <span>
                        {selectedDocIds.map((d) => DOC_LABELS[d]).join(" · ")}
                      </span>
                      <button
                        type="button"
                        className="summary-edit"
                        onClick={() => setStep(1)}
                      >
                        ändern
                      </button>
                    </div>

                    {/* E-Mail */}
                    <div className="field-group">
                      <label className="field-label" htmlFor="email">
                        Ihre E-Mail-Adresse <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="name@praxis.de"
                        autoComplete="email"
                        className={emailError ? "error" : ""}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      {emailError && (
                        <p className="error-msg visible">
                          Bitte geben Sie eine gültige E-Mail-Adresse ein.
                        </p>
                      )}
                    </div>

                    {/* Berufsgruppe (Pflicht) */}
                    <div className="field-group">
                      <span className="field-label">
                        Ich bin … <span className="required">*</span>
                      </span>
                      <div className="options-group">
                        <label
                          className={`option-item${role === "dentist" ? " selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name="role"
                            checked={role === "dentist"}
                            onChange={() => setRole("dentist")}
                          />
                          <span className="option-label">
                            Zahnarzt / Zahnärztin
                          </span>
                        </label>
                        <label
                          className={`option-item${role === "patient" ? " selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name="role"
                            checked={role === "patient"}
                            onChange={() => setRole("patient")}
                          />
                          <span className="option-label">Patient / Patientin</span>
                        </label>
                        <label
                          className={`option-item${role === "industry" ? " selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name="role"
                            checked={role === "industry"}
                            onChange={() => setRole("industry")}
                          />
                          <span className="option-label">
                            Dentalhandel / Hersteller
                          </span>
                        </label>
                        <label
                          className={`option-item${role === "other" ? " selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name="role"
                            checked={role === "other"}
                            onChange={() => setRole("other")}
                          />
                          <span className="option-label">Sonstiges</span>
                        </label>
                      </div>
                      {role === "other" && (
                        <input
                          type="text"
                          className="role-other-input"
                          placeholder="Bitte angeben"
                          value={roleOther}
                          onChange={(e) => setRoleOther(e.target.value)}
                          autoFocus
                        />
                      )}
                      {roleError && (
                        <p className="error-msg visible">
                          {role === "other"
                            ? "Bitte tragen Sie Ihre Angabe ein."
                            : "Bitte wählen Sie eine Angabe."}
                        </p>
                      )}
                    </div>

                    {/* Newsletter opt-in */}
                    <div className="field-group">
                      <span className="field-label">
                        Newsletter & Updates
                        <span className="optional">optional</span>
                      </span>
                      <label className="newsletter-item">
                        <input
                          type="checkbox"
                          checked={newsletter}
                          onChange={() => setNewsletter((v) => !v)}
                        />
                        <span className="newsletter-label">
                          <strong>Ja, ich möchte informiert bleiben.</strong>
                          Ich bin damit einverstanden, dass die CleanImplant
                          Foundation mich künftig per E-Mail über Neuigkeiten,
                          Studienergebnisse, Veranstaltungen und weitere Themen
                          rund um Implantatqualität informiert. Eine Abmeldung
                          ist jederzeit möglich.
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
                        Zurück
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
                        {submitting ? "Wird gesendet …" : "White Paper anfordern"}
                      </button>
                    </div>

                    <p className="privacy-note">
                      Ihre Daten werden ausschließlich für den Versand des
                      Downloads und – bei entsprechender Zustimmung – für weitere
                      Informationen der CleanImplant Foundation verwendet. Eine
                      Weitergabe an Dritte erfolgt nicht.
                      <br />
                      <a href="/datenschutz" target="_blank">
                        Datenschutzerklärung
                      </a>
                    </p>
                  </>
                )}
              </form>
            </div>
          ) : success.confirmed ? (
            /* Sofort verfügbar (Bestandskontakt / direkt) */
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
              <h3>Vielen Dank!</h3>
              <p>
                Hier sind Ihre angeforderten Dokumente – wir haben sie Ihnen
                zusätzlich per E-Mail geschickt:
              </p>
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
            /* Bestätigung nötig (neue Adresse) */
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
              <h3>Fast geschafft!</h3>
              <p>
                Wir haben eine Bestätigungs-E-Mail an{" "}
                <strong>{success.email}</strong> gesendet. Bitte klicken Sie auf
                den Link darin – danach stehen Ihre Dokumente sofort zum Download
                bereit.
                <br />
                <br />
                Keine E-Mail erhalten? Bitte prüfen Sie auch Ihren Spam-Ordner.
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
