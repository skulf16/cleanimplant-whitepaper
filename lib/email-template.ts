import { DocumentId, DOCUMENTS } from "./documents";
import { signedDownloadUrl } from "./token";

interface BuildArgs {
  documents: DocumentId[];
  baseUrl: string;
  lang: "de" | "en";
}

interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

const COPY = {
  de: {
    subject: "Ihre CleanImplant Downloads",
    preheader: "Ihre angeforderten Dokumente stehen zum Download bereit.",
    heading: "Ihre Dokumente stehen bereit",
    greeting: "Guten Tag,",
    intro:
      "vielen Dank für Ihr Interesse. Über die folgenden Links laden Sie Ihre angeforderten Dokumente herunter:",
    download: "Herunterladen",
    validity:
      "Hinweis: Aus Sicherheitsgründen sind diese Download-Links 14 Tage gültig.",
    closing: "Herzliche Grüße",
    team: "Ihre CleanImplant Foundation",
    footer: "CleanImplant Foundation · Pariser Platz 4a · 10117 Berlin",
  },
  en: {
    subject: "Your CleanImplant downloads",
    preheader: "Your requested documents are ready to download.",
    heading: "Your documents are ready",
    greeting: "Hello,",
    intro:
      "thank you for your interest. Download your requested documents via the links below:",
    download: "Download",
    validity:
      "Please note: for security reasons these download links are valid for 14 days.",
    closing: "Best regards",
    team: "Your CleanImplant Foundation",
    footer: "CleanImplant Foundation · Pariser Platz 4a · 10117 Berlin",
  },
};

const NAVY = "#0c2f4d";
const BLUE = "#48a5c5";
const BG = "#f0f7fb";
const BORDER = "#d6e8f0";
const MUTED = "#5a7a8f";

export function buildDownloadEmail({
  documents,
  baseUrl,
  lang,
}: BuildArgs): BuiltEmail {
  const c = COPY[lang];
  const base = baseUrl.replace(/\/$/, "");

  const items = documents.map((id) => ({
    label: DOCUMENTS[id].label,
    url: signedDownloadUrl(baseUrl, id),
  }));

  const buttonsHtml = items
    .map(
      (it) => `
      <tr>
        <td style="padding:0 0 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
            <tr>
              <td align="center" bgcolor="${BLUE}" style="border-radius:100px;">
                <a href="${it.url}" target="_blank"
                   style="display:block;padding:14px 24px;font-family:Helvetica,Arial,sans-serif;
                          font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;
                          letter-spacing:0.02em;border-radius:100px;">
                  &#11015;&nbsp;&nbsp;${c.download}: ${escapeHtml(it.label)}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <title>${escapeHtml(c.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};">
  <!-- Preheader (versteckt) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
    ${escapeHtml(c.preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background-color:${BG};border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <table role="presentation" width="560" cellpadding="0" cellspacing="0"
               style="width:560px;max-width:560px;background-color:#ffffff;border:1px solid ${BORDER};
                      border-radius:8px;border-collapse:separate;overflow:hidden;">

          <!-- Header mit Logo -->
          <tr>
            <td align="center" style="padding:32px 32px 24px;border-bottom:3px solid ${BLUE};">
              <img src="${base}/email-logo.png" alt="CleanImplant Foundation"
                   width="180" style="display:block;width:180px;max-width:60%;height:auto;border:0;" />
            </td>
          </tr>

          <!-- Inhalt -->
          <tr>
            <td style="padding:32px;font-family:Helvetica,Arial,sans-serif;">
              <h1 style="margin:0 0 18px;font-size:20px;line-height:1.3;font-weight:bold;color:${NAVY};">
                ${escapeHtml(c.heading)}
              </h1>
              <p style="margin:0 0 8px;font-size:15px;color:${NAVY};">${escapeHtml(c.greeting)}</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${MUTED};">
                ${escapeHtml(c.intro)}
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                     style="border-collapse:collapse;">
                ${buttonsHtml}
              </table>

              <p style="margin:20px 0 28px;font-size:12px;line-height:1.6;color:${MUTED};">
                ${escapeHtml(c.validity)}
              </p>

              <p style="margin:0;font-size:15px;line-height:1.6;color:${NAVY};">
                ${escapeHtml(c.closing)}<br />
                <strong>${escapeHtml(c.team)}</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" bgcolor="${NAVY}"
                style="padding:20px 32px;font-family:Helvetica,Arial,sans-serif;">
              <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.6);">
                ${escapeHtml(c.footer)}
              </p>
              <a href="https://www.cleanimplant.org" target="_blank"
                 style="font-size:12px;color:${BLUE};text-decoration:none;font-weight:bold;">
                www.cleanimplant.org
              </a>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    c.greeting,
    "",
    c.intro,
    "",
    ...items.map((it) => `• ${it.label}:\n  ${it.url}`),
    "",
    c.validity,
    "",
    c.closing,
    c.team,
    "",
    c.footer,
    "www.cleanimplant.org",
  ].join("\n");

  return { subject: c.subject, html, text };
}

const CONFIRM_COPY = {
  de: {
    subject: "Bitte bestätigen Sie Ihre Anfrage",
    preheader: "Ein Klick noch – dann stehen Ihre Dokumente bereit.",
    heading: "Nur noch ein Schritt",
    greeting: "Guten Tag,",
    intro:
      "vielen Dank für Ihr Interesse. Bitte bestätigen Sie kurz Ihre E-Mail-Adresse – danach erhalten Sie direkt Ihre angeforderten Dokumente:",
    button: "Bestätigen & herunterladen",
    requested: "Angefordert:",
    note: "Wenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail einfach.",
    closing: "Herzliche Grüße",
    team: "Ihre CleanImplant Foundation",
    footer: "CleanImplant Foundation · Pariser Platz 4a · 10117 Berlin",
  },
  en: {
    subject: "Please confirm your request",
    preheader: "One click away from your documents.",
    heading: "One last step",
    greeting: "Hello,",
    intro:
      "thank you for your interest. Please confirm your email address – right after, you'll get your requested documents:",
    button: "Confirm & download",
    requested: "Requested:",
    note: "If you didn't make this request, simply ignore this email.",
    closing: "Best regards",
    team: "Your CleanImplant Foundation",
    footer: "CleanImplant Foundation · Pariser Platz 4a · 10117 Berlin",
  },
};

export function buildConfirmEmail({
  confirmUrl,
  documents,
  lang,
  baseUrl,
}: {
  confirmUrl: string;
  documents: DocumentId[];
  lang: "de" | "en";
  baseUrl: string;
}): BuiltEmail {
  const c = CONFIRM_COPY[lang];
  const base = baseUrl.replace(/\/$/, "");
  const listHtml = documents
    .map(
      (id) =>
        `<li style="margin:0 0 4px;">${escapeHtml(DOCUMENTS[id].label)}</li>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <title>${escapeHtml(c.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(
    c.preheader
  )}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG};border-collapse:collapse;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:560px;background-color:#ffffff;border:1px solid ${BORDER};border-radius:8px;border-collapse:separate;overflow:hidden;">
        <tr><td align="center" style="padding:32px 32px 24px;border-bottom:3px solid ${BLUE};">
          <img src="${base}/email-logo.png" alt="CleanImplant Foundation" width="180" style="display:block;width:180px;max-width:60%;height:auto;border:0;" />
        </td></tr>
        <tr><td style="padding:32px;font-family:Helvetica,Arial,sans-serif;">
          <h1 style="margin:0 0 18px;font-size:20px;line-height:1.3;font-weight:bold;color:${NAVY};">${escapeHtml(
            c.heading
          )}</h1>
          <p style="margin:0 0 8px;font-size:15px;color:${NAVY};">${escapeHtml(
            c.greeting
          )}</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${MUTED};">${escapeHtml(
            c.intro
          )}</p>
          <p style="margin:0 0 6px;font-size:13px;font-weight:bold;color:${NAVY};">${escapeHtml(
            c.requested
          )}</p>
          <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:${MUTED};">${listHtml}</ul>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
            <tr><td align="center" bgcolor="${BLUE}" style="border-radius:100px;">
              <a href="${confirmUrl}" target="_blank" style="display:block;padding:14px 32px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:100px;">${escapeHtml(
                c.button
              )}</a>
            </td></tr>
          </table>
          <p style="margin:0 0 20px;font-size:12px;line-height:1.6;color:${MUTED};">${escapeHtml(
            c.note
          )}</p>
          <p style="margin:0;font-size:15px;line-height:1.6;color:${NAVY};">${escapeHtml(
            c.closing
          )}<br /><strong>${escapeHtml(c.team)}</strong></p>
        </td></tr>
        <tr><td align="center" bgcolor="${NAVY}" style="padding:20px 32px;font-family:Helvetica,Arial,sans-serif;">
          <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.6);">${escapeHtml(
            c.footer
          )}</p>
          <a href="https://www.cleanimplant.org" target="_blank" style="font-size:12px;color:${BLUE};text-decoration:none;font-weight:bold;">www.cleanimplant.org</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    c.greeting,
    "",
    c.intro,
    "",
    `${c.requested} ${documents.map((id) => DOCUMENTS[id].label).join(", ")}`,
    "",
    `${c.button}: ${confirmUrl}`,
    "",
    c.note,
    "",
    c.closing,
    c.team,
    "",
    c.footer,
  ].join("\n");

  return { subject: c.subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
