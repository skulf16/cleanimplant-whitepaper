export type Locale = "de" | "en";

export interface Strings {
  langNav: { de: string; en: string };
  eyebrow: string;
  h1a: string;
  h1em: string;
  subtitle: string;
  coverDe: string;
  coverEn: string;
  guidelineTitle: string;
  guidelineText: string;
  guidelineMeta: string;
  add: string;
  selected: string;
  step1kicker: string;
  step2kicker: string;
  step1title: string;
  step2title: string;
  doneKicker: string;
  doneTitle: string;
  selectionLabel: string;
  wpDe: string;
  wpEn: string;
  guidelineShort: string;
  langError: string;
  guidelineCtaTitle: string;
  guidelineCtaText: string;
  next: string;
  change: string;
  emailLabel: string;
  emailPlaceholder: string;
  emailError: string;
  roleLabel: string;
  roleDentist: string;
  rolePatient: string;
  roleIndustry: string;
  roleOther: string;
  roleOtherPlaceholder: string;
  roleErrorOther: string;
  roleErrorSelect: string;
  newsletterLabel: string;
  optional: string;
  newsletterStrong: string;
  newsletterText: string;
  back: string;
  submit: string;
  submitting: string;
  privacy: string;
  privacyLink: string;
  genericError: string;
  thanksTitle: string;
  thanksText: string;
  almostTitle: string;
  almostBefore: string;
  almostAfter: string;
  spamNote: string;
}

export const T: Record<Locale, Strings> = {
  de: {
    langNav: { de: "DE", en: "EN" },
    eyebrow: "CleanImplant Sonder-Publikationen",
    h1a: "Peri-implantitis und der",
    h1em: "übersehene Risikofaktor",
    subtitle:
      "White Paper zu klinischen und wirtschaftlichen Implikationen für Zahnärztinnen und Zahnärzte, für implantologische und implantatprothetische Praxen und Überweiser.",
    coverDe: "Deutsch",
    coverEn: "English",
    guidelineTitle: "CleanImplant Guideline (Revision 2025)",
    guidelineText:
      "Verfahrensbeschreibung und Leistungskriterien für das CleanImplant Trusted Quality Seal",
    guidelineMeta:
      "Vollständige konsensbasierte Leitlinie · überarbeitet 2025 · 28 Seiten, 50 REM-Aufnahmen",
    add: "Hinzufügen",
    selected: "Ausgewählt",
    step1kicker: "Schritt 1 von 2 · Auswahl",
    step2kicker: "Schritt 2 von 2 · Ihre Daten",
    step1title: "Welche Dokumente möchten Sie?",
    step2title: "Wohin dürfen wir senden?",
    doneKicker: "Geschafft",
    doneTitle: "Ihre Downloads",
    selectionLabel: "Verfügbare Sonder-Publikationen",
    wpDe: "White Paper Deutsch",
    wpEn: "White Paper English",
    guidelineShort: "Guideline",
    langError: "Bitte wählen Sie mindestens eine Sprache.",
    guidelineCtaTitle: "CleanImplant Guideline (Revision 2025)",
    guidelineCtaText:
      "Senden Sie mir zusätzlich die aktuelle CleanImplant-Leitlinie mit Leistungskriterien für saubere Implantate (PDF in Englisch).",
    next: "Weiter",
    change: "ändern",
    emailLabel: "Ihre E-Mail-Adresse",
    emailPlaceholder: "name@praxis.de",
    emailError: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    roleLabel: "Ich bin …",
    roleDentist: "Zahnarzt / Zahnärztin",
    rolePatient: "Patient / Patientin",
    roleIndustry: "Dentalhandel / Hersteller",
    roleOther: "Sonstiges",
    roleOtherPlaceholder: "Bitte angeben",
    roleErrorOther: "Bitte tragen Sie Ihre Angabe ein.",
    roleErrorSelect: "Bitte wählen Sie eine Angabe.",
    newsletterLabel: "Newsletter & Updates",
    optional: "optional",
    newsletterStrong: "Ja, ich möchte informiert bleiben.",
    newsletterText:
      "Ich bin damit einverstanden, dass die CleanImplant Foundation mich künftig per E-Mail über Neuigkeiten, Studienergebnisse, Veranstaltungen und weitere Themen rund um Implantatqualität informiert. Eine Abmeldung ist jederzeit möglich.",
    back: "Zurück",
    submit: "White Paper anfordern",
    submitting: "Wird gesendet …",
    privacy:
      "Ihre Daten werden ausschließlich für den Versand des Downloads und – bei entsprechender Zustimmung – für weitere Informationen der CleanImplant Foundation verwendet. Eine Weitergabe an Dritte erfolgt nicht.",
    privacyLink: "Datenschutzerklärung",
    genericError: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
    thanksTitle: "Vielen Dank!",
    thanksText:
      "Hier sind Ihre angeforderten Dokumente – wir haben sie Ihnen zusätzlich per E-Mail geschickt:",
    almostTitle: "Fast geschafft!",
    almostBefore: "Wir haben eine Bestätigungs-E-Mail an ",
    almostAfter:
      " gesendet. Bitte klicken Sie auf den Link darin – danach stehen Ihre Dokumente sofort zum Download bereit.",
    spamNote: "Keine E-Mail erhalten? Bitte prüfen Sie auch Ihren Spam-Ordner.",
  },
  en: {
    langNav: { de: "DE", en: "EN" },
    eyebrow: "CleanImplant Special Publications",
    h1a: "The missing variable in",
    h1em: "peri-implantitis",
    subtitle:
      "White Paper on the clinical and economic implications for dentists, for implantology and implant-prosthetic practices and referrers.",
    coverDe: "German",
    coverEn: "English",
    guidelineTitle: "CleanImplant Guideline (Revision 2025)",
    guidelineText:
      "Process description and performance criteria for the CleanImplant Trusted Quality Seal",
    guidelineMeta:
      "The complete consensus-based guideline · revised 2025 · 28 pages, 50 SEM images",
    add: "Add",
    selected: "Selected",
    step1kicker: "Step 1 of 2 · Selection",
    step2kicker: "Step 2 of 2 · Your details",
    step1title: "Which documents would you like?",
    step2title: "Where should we send them?",
    doneKicker: "Done",
    doneTitle: "Your downloads",
    selectionLabel: "Available special publications",
    wpDe: "White Paper German",
    wpEn: "White Paper English",
    guidelineShort: "Guideline",
    langError: "Please select at least one language.",
    guidelineCtaTitle: "CleanImplant Guideline (Revision 2025)",
    guidelineCtaText:
      "Please also send me the CleanImplant Guideline with performance criteria for clean implants.",
    next: "Next",
    change: "change",
    emailLabel: "Your email address",
    emailPlaceholder: "name@practice.com",
    emailError: "Please enter a valid email address.",
    roleLabel: "I am …",
    roleDentist: "Dentist",
    rolePatient: "Patient",
    roleIndustry: "Dental trade / Manufacturer",
    roleOther: "Other",
    roleOtherPlaceholder: "Please specify",
    roleErrorOther: "Please enter your answer.",
    roleErrorSelect: "Please select an option.",
    newsletterLabel: "Newsletter & updates",
    optional: "optional",
    newsletterStrong: "Yes, keep me informed.",
    newsletterText:
      "I agree that the CleanImplant Foundation may contact me by email about news, study results, events and other topics related to implant quality. I can unsubscribe at any time.",
    back: "Back",
    submit: "Request White Paper",
    submitting: "Sending …",
    privacy:
      "Your data is used solely to send the download and — with your consent — for further information from the CleanImplant Foundation. It is never shared with third parties.",
    privacyLink: "Privacy policy",
    genericError: "Something went wrong. Please try again.",
    thanksTitle: "Thank you!",
    thanksText:
      "Here are your requested documents — we've also sent them to you by email:",
    almostTitle: "Almost there!",
    almostBefore: "We've sent a confirmation email to ",
    almostAfter:
      ". Please click the link inside — your documents will then be ready to download.",
    spamNote: "No email? Please also check your spam folder.",
  },
};
