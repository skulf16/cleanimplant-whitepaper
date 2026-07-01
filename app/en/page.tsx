import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "Download White Paper – CleanImplant Foundation",
  description:
    "Download the CleanImplant White Paper on peri-implantitis and the current CleanImplant Guideline for free.",
};

export default function EnHome() {
  return <LandingPage locale="en" />;
}
