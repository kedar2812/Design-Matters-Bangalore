import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// next/font self-hosts these at build time — no runtime Google requests.
// display:"optional" — the headline is the LCP element, and a late
// font swap would re-stamp LCP seconds in. If Fraunces isn't ready
// within the browser's block window, the Georgia fallback stays for
// that page view; repeat visits always get Fraunces from cache.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
  display: "optional",
  adjustFontFallback: true,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Design Matters Architects — Architecture + Interior Design, Bengaluru",
    template: "%s — Design Matters Architects",
  },
  description:
    "Design Matters is an architecture and interior design studio in Bengaluru, led by Ar. Kiran Hanumaiah. Residences, apartments, commercial and hospitality spaces — designed with care since 2011.",
  openGraph: {
    type: "website",
    siteName: "Design Matters Architects",
    locale: "en_IN",
    // TODO: swap for a branded OG card once DMA photography arrives.
    images: ["/uploads/placeholders/vivek-residence-hero.jpg"],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
