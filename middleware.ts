import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// The studio and its login plain-404 — to a visitor the dashboard
// doesn't exist — when STUDIO_DISABLED=1 or when the deployment has no
// database (snapshot mode: the studio couldn't run anyway). Otherwise
// middleware is the usual edge JWT check for /studio (full session
// logic in lib/auth.ts); /login passes through.
const studioOff = (req: NextRequest) =>
  NextResponse.rewrite(new URL("/studio-disabled-404", req.url));

const authMiddleware = NextAuth(authConfig).auth as unknown as (
  req: NextRequest,
  ev: NextFetchEvent,
) => Promise<Response | undefined>;

/**
 * The dashboard lives only on its own host, e.g.
 * admin.designmattersarchitects.com.
 *
 * One app still serves both; the split is by Host header:
 *   - admin host: /studio and /login as usual, `/` goes to /studio, and any
 *     public page requested there is sent to the same path on the public
 *     site, so the admin host never serves a duplicate of the site.
 *   - public host: /studio, /login and the dashboard's own APIs
 *     (/api/auth, /api/upload) are a plain 404. Not a redirect — a
 *     redirect would announce where the dashboard is to anyone who tries
 *     /login on the public site. Links into the dashboard from outside it
 *     (emails, the one-tap page) go straight to the admin host via
 *     `studioOrigin()` in lib/admin-url.ts.
 *
 * Unset ADMIN_HOST (local dev, staging) and nothing here changes: the
 * studio stays at /studio on whatever host served the request. It is
 * read at runtime from the server's environment, so it must be in the
 * VPS .env that `next start` loads.
 */
const ADMIN_HOST = process.env.ADMIN_HOST?.trim().toLowerCase() || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

const isStudioPath = (p: string) =>
  p === "/login" || p.startsWith("/login/") || p === "/studio" || p.startsWith("/studio/");

/** APIs that only the dashboard uses. */
const isStudioApi = (p: string) =>
  p.startsWith("/api/auth/") || p === "/api/auth" || p.startsWith("/api/upload");

/** The host the visitor asked for — nginx passes it through as Host and
 *  X-Forwarded-Host; the request URL itself is 127.0.0.1:3000. */
function requestHost(req: NextRequest) {
  const raw = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  return raw.split(",")[0]!.trim().toLowerCase().replace(/:\d+$/, "");
}

export default async function middleware(req: NextRequest, ev: NextFetchEvent) {
  const { pathname, search } = req.nextUrl;

  if (ADMIN_HOST) {
    const onAdmin = requestHost(req) === ADMIN_HOST;

    if (onAdmin && pathname === "/") {
      return NextResponse.redirect(`https://${ADMIN_HOST}/studio`, 307);
    }
    if (onAdmin && !isStudioPath(pathname) && !isStudioApi(pathname) && SITE_URL) {
      return NextResponse.redirect(`${SITE_URL}${pathname}${search}`, 308);
    }
    if (!onAdmin && (isStudioPath(pathname) || isStudioApi(pathname))) {
      return studioOff(req);
    }
  }

  if (!isStudioPath(pathname)) return NextResponse.next();

  if (process.env.STUDIO_DISABLED === "1" || !process.env.DATABASE_URL) {
    return studioOff(req);
  }
  return authMiddleware(req, ev);
}

export const config = {
  // Everything except Next's own assets, the API, uploaded media and
  // files with an extension (icons, robots.txt, sitemap.xml, /brand, …).
  // The host split has to see page paths on both hosts, not just /studio.
  matcher: [
    "/((?!_next/|api/|uploads/|.*\\.[a-zA-Z0-9]+$).*)",
    "/api/auth/:path*",
    "/api/upload/:path*",
    "/api/upload",
  ],
};
