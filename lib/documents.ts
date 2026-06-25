// Zentrale Definition aller herunterladbaren Dokumente.
// Die `file`-Pfade zeigen auf PDFs in /public/downloads/.
// Sobald die echten PDFs hochgeladen sind, hier ggf. die Dateinamen anpassen.

export type DocumentId = "whitepaper_de" | "whitepaper_en" | "guidelines";

export interface DocumentDef {
  id: DocumentId;
  /** Anzeigename im Formular und in der E-Mail */
  label: string;
  /** Dateiname in /public/downloads/ */
  file: string;
  /** Sprache des Dokuments – steuert u. a. die E-Mail-Sprache */
  lang: "de" | "en";
}

export const DOCUMENTS: Record<DocumentId, DocumentDef> = {
  whitepaper_de: {
    id: "whitepaper_de",
    label: "Whitepaper „Die übersehene Variable bei Periimplantitis“ (Deutsch)",
    file: "whitepaper-de.pdf",
    lang: "de",
  },
  whitepaper_en: {
    id: "whitepaper_en",
    label: "Whitepaper „The Overlooked Variable in Peri-Implantitis“ (English)",
    file: "whitepaper-en.pdf",
    lang: "en",
  },
  guidelines: {
    id: "guidelines",
    label: "CleanImplant Quality Guidelines",
    file: "guidelines.pdf",
    lang: "en",
  },
};

export const ALL_DOCUMENT_IDS = Object.keys(DOCUMENTS) as DocumentId[];

export function isDocumentId(value: unknown): value is DocumentId {
  return typeof value === "string" && value in DOCUMENTS;
}

// Ordner mit den geschützten PDFs – liegt NICHT unter /public und wird
// daher nicht statisch ausgeliefert. Zugriff nur über /api/download.
export const PROTECTED_DIR = "protected-downloads";
