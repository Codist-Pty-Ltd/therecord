import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";

import Footer from "@/components/Layout/Footer";
import Header from "@/components/Layout/Header";
import UmamiScript from "@/components/analytics/UmamiScript";
import GlobalSearch from "@/components/Search/GlobalSearch";
import RootProviders from "@/providers/RootProviders";

import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://therecord.co.za"),
  title: {
    default: "The Record",
    template: "%s | The Record",
  },
  description:
    "Track South African stories from incident to verdict. Every charge explained. Every law linked.",
  robots: {
    index: true,
    follow: true,
  },
  keywords: [
    "South Africa",
    "law",
    "commissions",
    "accountability",
    "corruption",
    "court cases",
    "legal intelligence",
  ],
  openGraph: {
    type: "website",
    siteName: "The Record",
    locale: "en_ZA",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-ZA"
      className={`${instrumentSerif.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="robots" content="index, follow" />
      </head>
      {/*
       * `suppressHydrationWarning` on <body> absorbs attribute mismatches
       * that come from browser extensions (ColorZilla adds cz-shortcut-listen,
       * Grammarly adds data-gr-ext-installed, etc.) injecting into the DOM
       * before React hydrates. It only suppresses mismatches on THIS element
       * — children still reconcile normally.
       */}
      <body
        className="min-h-screen bg-cream text-charcoal font-sans flex flex-col"
        suppressHydrationWarning
      >
        <RootProviders>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300] focus:bg-charcoal focus:text-cream focus:px-4 focus:py-2 focus:rounded focus:font-mono focus:text-sm"
          >
            Skip to main content
          </a>
          <Header />
          <main id="main-content" className="flex-1" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <GlobalSearch />
          <UmamiScript />
        </RootProviders>
      </body>
    </html>
  );
}
