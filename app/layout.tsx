import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "White Paper herunterladen – CleanImplant Foundation",
  description:
    "Laden Sie das CleanImplant White Paper zu Peri-Implantitis sowie die aktuelle CleanImplant Guideline kostenlos herunter.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
