import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "White Paper herunterladen – CleanImplant Foundation",
  description:
    "Laden Sie das CleanImplant White Paper zu Peri-Implantitis sowie die aktuelle CleanImplant Guideline kostenlos herunter.",
};

const PATHS = { de: "/de", en: "/" };

export default function De() {
  return <LandingPage locale="de" paths={PATHS} />;
}
