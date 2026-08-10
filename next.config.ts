import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,

  images: {
    // AVIF first, WebP fallback — the single biggest perf lever (§8).
    formats: ["image/avif", "image/webp"],
    // The default ladder jumps 2048 → 3840, so a 2560px desktop asks for
    // 3840 and the optimiser re-encodes the whole source for a slot that
    // never needed it. 2560 matches the widest hero we actually ship.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3840],
    // Uploaded media is immutable (new uploads get new names) — let
    // the optimizer cache aggressively; Cloudflare caches on top.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async redirects() {
    // 301 explicitly throughout, not `permanent: true` — that emits 308,
    // which search engines honour but a lot of SEO tooling still reports
    // as a soft/unknown redirect. 301 is the one everything understands.
    const moved = (source: string, destination: string) => ({
      source,
      destination,
      statusCode: 301 as const,
    });

    return [
      // §2.2 — "Club Nadora" was a standalone project; it is now the
      // clubhouse section inside Woodsvale.
      moved("/projects/club-nadora-woodsvale", "/projects/woodsvale"),

      /* ------------------------------------------------ Wix cutover
       *
       * The old site is a Wix build at designmattersarchitects.com with
       * every page hanging off the root. The day the domain points here,
       * all thirty-eight of those URLs become 404s unless something
       * catches them, and fifteen years of accumulated links and rankings
       * go with them. These are that catch.
       *
       * The mapping was read off the old pages, not inferred from their
       * slugs, because on that site the two disagree: Wix's "duplicate
       * page" flow left a trail of `copy-of-` URLs that were then filled
       * with completely different projects. `/copy-of-neeraj-residence`
       * is Vivek Residence. `/copy-of-soumya-and-chetan-s-residence` is
       * the Jibeesh residence. `/copy-of-mvm` is the Badami public
       * library. Every line below was confirmed against the <title> of
       * the live page it points away from.
       *
       * Where a project did not survive into the new portfolio the
       * redirect goes to its practice area rather than to the home page:
       * a visitor looking for a house lands among houses, which is the
       * nearest true answer. Anything whose type is not obvious from the
       * page itself goes to /projects rather than to a guess.
       *
       * /about and /contact are deliberately absent — the paths are the
       * same on both sites and already resolve. Adding them would be a
       * redirect loop.
       */

      // Sections.
      moved("/testimonial", "/testimonials"),
      moved("/projects-7", "/projects/residential"), // titled "RESIDENTIAL"
      moved("/apartments", "/projects/residential"),
      moved("/interior", "/projects/interiors"),
      moved("/architecture", "/projects"),
      moved("/institute", "/projects"), // titled "COMMERCIAL"
      moved("/hospitality", "/projects"),

      // Projects that carried over, with the page they are now.
      moved("/copy-of-neeraj-residence", "/projects/vivek-residence"),
      moved("/copy-of-neeraj-residence-1", "/projects/soumya-and-chetan-residence"),
      moved("/copy-of-soumya-and-chetan-s-residence", "/projects/jibeesh-residence"),
      moved("/jibeesh-residence", "/projects/jibeesh-residence"),
      moved("/copy-of-mvm", "/projects/badami-public-library"),
      moved("/mohan-residence", "/projects/mohan-residence"),
      moved("/la-palazzo", "/projects/la-palazzo"),
      moved("/prayaag", "/projects/prayaag-montessori"),

      // Houses with no page of their own yet — sent to the houses.
      moved("/neeraj-residence", "/projects/residential"),
      moved("/praveen-residence", "/projects/residential"),
      moved("/copy-of-praveen-residence", "/projects/residential"), // "ANITHA TEJAS"
      moved("/copy-of-jibeesh-residence", "/projects/residential"), // "VENKATESH ELAPPAN"
      moved("/gururaj-residence", "/projects/residential"),
      moved("/manu-and-gayatri", "/projects/residential"),
      moved("/indiranagar-duplex-residence", "/projects/residential"),
      moved("/courtyard-house", "/projects/residential"),
      moved("/casa-grande-luxus", "/projects/residential"),

      // Fit-outs with no page of their own yet — sent to the interiors.
      moved("/suraj-interiors", "/projects/interiors"),
      moved("/epsilon", "/projects/interiors"),
      moved("/snn", "/projects/interiors"), // "SNN CLERMONT"
      moved("/girish-shenoy-tata-pro", "/projects/interiors"), // "TATA PROMONT"
      moved("/indiranagar-dental-clinic", "/projects/interiors"),

      // Institutional work with no page of its own yet.
      moved("/copy-of-badami-public-library", "/projects/institutional"), // "badami bus stand"

      // Type not established from the old page — the index is the honest
      // answer. Point any of these at a category once the studio confirms
      // what it was.
      moved("/mvm", "/projects"),
      moved("/discovery-village-kanakpura", "/projects"),
      moved("/kormangala-project", "/projects"),
      moved("/santa-cruz", "/projects"),
      moved("/wellington-street", "/projects"),
    ];
  },

  async headers() {
    return [
      {
        // Uploaded media: content-hashed filenames → cache forever.
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
