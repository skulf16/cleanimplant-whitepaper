import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "CleanImplant Guideline herunterladen – CleanImplant Foundation",
  description:
    "Laden Sie die CleanImplant Guideline (Revision 2025) kostenlos herunter – das White Paper gibt es optional dazu.",
};

const PATHS = { de: "/de/leitlinie", en: "/guideline" };

export default function DeLeitlinie() {
  return <LandingPage locale="de" variant="guideline" paths={PATHS} />;
}
