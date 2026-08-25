import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ScrollToTop } from "@/components/motion/ScrollToTop";
import { KEYWORDS, OG_IMAGE, SITE_URL } from "@/lib/seo";
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
    // The home page title leads with the query and ends with the name.
    // Google truncates a title around sixty characters, so the previous
    // one — brand first, then the service, then the city — lost the city
    // entirely, which is the word the search actually contains.
    //
    // "Bangalore" rather than "Bengaluru" for the same reason: the prose
    // on every page uses the studio's spelling, but the title has to
    // match what gets typed, and it is queried several times more often.
    // The WebSite schema carries the full studio name, so the brand is
    // still what prints above the result.
    default: "Architects & Interior Designers in Bangalore | Design Matters",
    template: "%s | Design Matters Architects",
  },
  description:
    "Architecture and interior design studio in Indiranagar, Bangalore, led by Ar. Kiran Hanumaiah. Residences, villas, interiors and commercial work since 2011.",
  keywords: [...KEYWORDS],
  applicationName: "Design Matters Architects",
  authors: [{ name: "Design Matters Architects", url: SITE_URL }],
  creator: "Design Matters Architects",
  publisher: "Design Matters Architects",
  category: "Architecture",
  // Explicit rather than inherited: `max-image-preview:large` is what
  // lets Google run a full-width photograph in the result, which for a
  // portfolio is most of the click.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Both read from env so the client can paste the codes from Search
  // Console and Bing Webmaster Tools at deploy without a code change.
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION && {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    }),
    ...(process.env.BING_SITE_VERIFICATION && {
      other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION },
    }),
  },
  openGraph: {
    type: "website",
    siteName: "Design Matters Architects",
    locale: "en_IN",
    url: "/",
    images: [{ ...OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE.url],
  },
  // No `icons` block: app/favicon.ico, app/icon.png and app/apple-icon.png
  // are file conventions and Next emits the <link> tags for all three,
  // content-hashed. Declaring them here as well only duplicated the
  // favicon link with an unhashed URL.
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}
    >
      <head>
        {/* `?theme=dark|light` seeds the stored preference before
            next-themes initialises, used for previews/screenshots.
            next-themes injects its own pre-paint script for the class. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var q=new URLSearchParams(location.search).get("theme");if(q==="dark"||q==="light")localStorage.setItem("dma-theme",q)}catch(e){}`,
          }}
        />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="dma-theme"
          disableTransitionOnChange
        >
          <ScrollToTop />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
