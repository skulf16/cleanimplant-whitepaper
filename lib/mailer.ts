import nodemailer from "nodemailer";

// SMTP-Zugang wird über Umgebungsvariablen konfiguriert (siehe .env.example).
// Fehlt die Konfiguration, wird der Versand übersprungen (nützlich für lokale Tests).

export function isMailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // Port 465 nutzt implizites TLS, sonst STARTTLS
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

/** Diagnose: prüft die SMTP-Verbindung (ohne Mailversand). */
export async function verifyMail(): Promise<{
  configured: boolean;
  ok: boolean;
  error?: string;
}> {
  if (!isMailConfigured()) {
    return { configured: false, ok: false, error: "SMTP nicht konfiguriert" };
  }
  try {
    await getTransporter().verify();
    return { configured: true, ok: true };
  } catch (err) {
    return { configured: true, ok: false, error: String(err) };
  }
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendMail({ to, subject, html, text }: SendArgs): Promise<void> {
  if (!isMailConfigured()) {
    console.warn(
      `[mailer] SMTP nicht konfiguriert – E-Mail an ${to} wird nicht versendet.\nBetreff: ${subject}`
    );
    return;
  }

  const from =
    process.env.SMTP_FROM ||
    `CleanImplant Foundation <${process.env.SMTP_USER}>`;

  await getTransporter().sendMail({ from, to, subject, html, text });
}
