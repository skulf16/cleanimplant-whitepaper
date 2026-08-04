import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Download White Paper – CleanImplant Foundation",
  description:
    "Download the CleanImplant White Paper on peri-implantitis and the current CleanImplant Guideline for free.",
};

const META_PIXEL_ID = "4385310895025341";
const COOKIEBOT_CBID = "18f2353d-2699-4793-976e-22d2b9da7176";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
      <body>
        {/*
          Consent + Tracking. Zwei Dinge sind hier absichtlich so und sollten
          nicht "aufgeräumt" werden:

          1. Rohe <script>-Tags statt next/script. `strategy="beforeInteractive"`
             injiziert die Skripte per JS und setzt dabei async=true – Cookiebot
             läuft dann u. U. erst NACH dem Pixel und Auto-Blocking greift nicht.
             Als rohes, synchrones Tag blockt der Parser, bis Cookiebot lief.
          2. Platzierung am Anfang von <body>, nicht im <head>. Im manuell
             gesetzten <head> fügt React die Tags bei der Hydration ein zweites
             Mal ein: Cookiebot lädt doppelt, PageView feuert zweimal.

          Reihenfolge ist entscheidend und ergibt sich aus der Deklaration hier:
          1. Google Consent Mode Defaults – alles "denied", bevor irgendein Tag lädt
          2. Cookiebot
          3. Meta Pixel – als type="text/plain" mit data-cookieconsent="marketing",
             siehe Kommentar dort.
        */}
        <script
          id="google-consent-mode-default"
          data-cookieconsent="ignore"
          dangerouslySetInnerHTML={{ __html: `
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        dataLayer.push(arguments);
    }
    gtag("consent", "default", {
        ad_personalization: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        analytics_storage: "denied",
        functionality_storage: "denied",
        personalization_storage: "denied",
        security_storage: "granted",
        wait_for_update: 500,
    });
    gtag("set", "ads_data_redaction", true);
    gtag("set", "url_passthrough", false);` }}
        />

        {/* Cookiebot */}
        <script
          id="Cookiebot"
          src="https://consent.cookiebot.com/uc.js"
          data-cbid={COOKIEBOT_CBID}
          data-blockingmode="auto"
          type="text/javascript"
        />

        {/*
          Meta Pixel Code

          type="text/plain" + data-cookieconsent="marketing" ist Cookiebots
          explizite (manuelle) Blockierung: der Browser führt das Script nicht
          aus, Cookiebot setzt den Typ erst nach erteilter Marketing-Einwilligung
          auf text/javascript und startet es dann.

          Bewusst NICHT auf data-blockingmode="auto" verlassen: ein Inline-Script
          direkt nach Cookiebot wird beim Parsen synchron ausgeführt, bevor
          Cookiebots Rewriting eingreifen kann. Live gemessen hatte der Pixel
          dadurch ohne jede Einwilligung PageView gesendet und _fbp gesetzt.
        */}
        <script
          id="meta-pixel"
          type="text/plain"
          data-cookieconsent="marketing"
          dangerouslySetInnerHTML={{ __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src='https://connect.facebook.net/en_US/fbevents.js';
s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');` }}
        />
        {/*
          Der <noscript>-Fallback-Pixel von Meta fehlt hier absichtlich: ohne
          JavaScript läuft Cookiebot nicht, das Bild würde also zwangsläufig ohne
          Einwilligung geladen. Nicht blockierbar heißt hier: weglassen.
        */}
        {/* End Meta Pixel Code */}

        {children}
      </body>
    </html>
  );
}
