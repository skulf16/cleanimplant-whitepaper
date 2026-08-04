import type { Metadata } from "next";
import ThankYouPage from "@/components/ThankYouPage";

export const metadata: Metadata = {
  title: "Thank you – CleanImplant Foundation",
  description:
    "Your requested CleanImplant documents are ready for download and on their way by email.",
  // Danke-Seiten gehören nicht in den Index
  robots: { index: false, follow: false },
};

const PATHS = { de: "/danke", en: "/thank-you" };

export default function ThankYou() {
  return <ThankYouPage locale="en" paths={PATHS} formPath="/" />;
}
