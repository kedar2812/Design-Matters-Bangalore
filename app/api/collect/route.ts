import { prisma } from "@/lib/db";

const BOT_UA =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse|pingdom|uptime/i;

/**
 * First-party analytics collector. Stores path + coarse context only:
 * no IP, no cookies, no user identifier. Country comes from
 * Cloudflare's CF-IPCountry header in production.
 */
export async function POST(req: Request) {
  try {
    const ua = req.headers.get("user-agent") ?? "";
    if (BOT_UA.test(ua)) return new Response(null, { status: 204 });

    const body = await req.json().catch(() => null);
    const path: unknown = body?.path;
    if (typeof path !== "string" || !path.startsWith("/") || path.length > 200) {
      return new Response(null, { status: 204 });
    }
    // Never track the studio itself.
    if (path.startsWith("/studio") || path.startsWith("/login")) {
      return new Response(null, { status: 204 });
    }

    const referrer =
      typeof body?.referrer === "string" ? body.referrer.slice(0, 300) : null;
    // Ignore self-referrals (internal navigation).
    let refHost: string | null = null;
    if (referrer) {
      try {
        const host = new URL(referrer).hostname;
        const own = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").hostname;
        refHost = host === own ? null : host;
      } catch {
        refHost = null;
      }
    }

    await prisma.pageView.create({
      data: {
        path,
        referrer: refHost,
        source:
          typeof body?.source === "string" ? body.source.slice(0, 100) : refHost,
        country: req.headers.get("cf-ipcountry"),
        device: /Mobi|Android/i.test(ua) ? "mobile" : "desktop",
      },
    });
  } catch {
    /* never fail the visitor's request over analytics */
  }
  return new Response(null, { status: 204 });
}
