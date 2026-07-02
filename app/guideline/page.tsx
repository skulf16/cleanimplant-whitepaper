import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "Download the CleanImplant Guideline – CleanImplant Foundation",
  description:
    "Download the CleanImplant Guideline (Revision 2025) for free – the White Paper is available as an optional add-on.",
};

const PATHS = { de: "/de/leitlinie", en: "/guideline" };

export default function Guideline() {
  return <LandingPage locale="en" variant="guideline" paths={PATHS} />;
}
