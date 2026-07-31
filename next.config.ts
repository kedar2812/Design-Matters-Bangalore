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
    return [
      {
        // §2.2 — "Club Nadora" was a standalone project; it is now the
        // clubhouse section inside Woodsvale. Permanent so the existing
        // ranking follows the page rather than dying with the old URL.
        source: "/projects/club-nadora-woodsvale",
        destination: "/projects/woodsvale",
        // 301 explicitly, not `permanent: true` — that emits 308, which
        // search engines honour but a lot of SEO tooling still reports as
        // a soft/unknown redirect. 301 is the one everything understands.
        statusCode: 301,
      },
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
