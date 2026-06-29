// Zentrale Definition aller herunterladbaren Dokumente.
// Die `file`-Pfade zeigen auf PDFs in /public/downloads/.
// Sobald die echten PDFs hochgeladen sind, hier ggf. die Dateinamen anpassen.

export type DocumentId = "whitepaper_de" | "whitepaper_en" | "guidelines";

export interface DocumentDef {
  id: DocumentId;
  /** Anzeigename in E-Mail, Download-Links und Bestätigungsseite */
  label: string;
  /** Dateiname im geschützten Ordner (protected-downloads/) */
  file: string;
  /** Sauberer Dateiname beim Download (Content-Disposition) */
  downloadName: string;
  /** Sprache des Dokuments – steuert u. a. die E-Mail-Sprache */
  lang: "de" | "en";
}

export const DOCUMENTS: Record<DocumentId, DocumentDef> = {
  whitepaper_de: {
    id: "whitepaper_de",
    label: "WHITE PAPER „PERI-IMPLANTITIS UND DER ÜBERSEHENE RISIKOFAKTOR“",
    file: "whitepaper-de.pdf",
    downloadName:
      "CleanImplant White Paper - Peri-Implantitis und der übersehene Risikofaktor.pdf",
    lang: "de",
  },
  whitepaper_en: {
    id: "whitepaper_en",
    label: "WHITE PAPER „THE MISSING VARIABLE IN PERI-IMPLANTITIS“",
    file: "whitepaper-en.pdf",
    downloadName:
      "CleanImplant White Paper - The Missing Variable in Peri-Implantitis.pdf",
    lang: "en",
  },
  guidelines: {
    id: "guidelines",
    label: "CLEANIMPLANT GUIDELINE (REVISION 2025)",
    file: "guidelines.pdf",
    downloadName: "CleanImplant Guideline (Revision 2025).pdf",
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
