import type { Metadata } from "next";
import ThankYouPage from "@/components/ThankYouPage";

export const metadata: Metadata = {
  title: "Vielen Dank – CleanImplant Foundation",
  description:
    "Ihre angeforderten CleanImplant-Dokumente stehen zum Download bereit und sind per E-Mail unterwegs.",
  // Danke-Seiten gehören nicht in den Index
  robots: { index: false, follow: false },
};

const PATHS = { de: "/danke", en: "/thank-you" };

export default function Danke() {
  return <ThankYouPage locale="de" paths={PATHS} formPath="/de" />;
}
