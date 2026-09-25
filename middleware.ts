import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { RETURN_COOKIE } from "@/lib/admin-url";

// The studio and its login plain-404 — to a visitor the dashboard
// doesn't exist — when STUDIO_DISABLED=1 or when the deployment has no
// database (snapshot mode: the studio couldn't run anyway). Otherwise
// middleware is the usual edge JWT check for /studio (full session
// logic in lib/auth.ts); /login passes through.
const studioOff = (req: NextRequest) =>
  NextResponse.rewrite(new URL("/studio-disabled-404", req.url));

type Middleware = (req: NextRequest, ev: NextFetchEvent) => Promise<Response | undefined>;

const { auth } = NextAuth(authConfig);
const authMiddleware = auth as unknown as Middleware;

/**
 * The dashboard lives only on its own host, e.g.
 * admin.designmattersarchitects.com.
 *
 * One app still serves both; the split is by Host header:
 *   - admin host: the bare origin is the front door. `/` shows the sign-in
 *     form, or the overview once signed in, so the address bar never
 *     reads more than the host. /login, /studio and /studio/dashboard
 *     fold back into `/`. Deeper studio pages work as usual; signed out,
 *     they go to `/` with the page remembered in a cookie (not a
 *     `?callbackUrl=`) for after sign-in. Any public page requested there
 *     is sent to the same path on the public site, so the admin host never
 *     serves a duplicate of the site.
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

/**
 * The admin host's pages, behind the session check.
 *
 * URLs are built from the original `req`, not the one Auth.js hands the
 * callback: Auth.js swaps that one's origin for AUTH_URL (the public admin
 * host), and a rewrite to a different origin than the server's own is
 * proxied back out through Cloudflare rather than served internally.
 */
const adminGate = (req: NextRequest, ev: NextFetchEvent) =>
  (
    auth((authed) => {
      const { pathname, search } = req.nextUrl;
      const signedIn = Boolean(authed.auth?.user);

      if (pathname === "/") {
        const page = signedIn ? "/studio/dashboard" : "/login";
        return NextResponse.rewrite(new URL(page, req.url));
      }
      if (signedIn) return NextResponse.next();

      const res = NextResponse.redirect(`https://${ADMIN_HOST}/`, 307);
      res.cookies.set(RETURN_COOKIE, `${pathname}${search}`, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 10,
      });
      return res;
    }) as unknown as Middleware
  )(req, ev);

export default async function middleware(req: NextRequest, ev: NextFetchEvent) {
  const { pathname, search } = req.nextUrl;

  if (ADMIN_HOST) {
    const onAdmin = requestHost(req) === ADMIN_HOST;

    if (onAdmin) {
      if (isStudioApi(pathname)) return NextResponse.next();
      if (pathname === "/login" || pathname === "/studio" || pathname === "/studio/dashboard") {
        return NextResponse.redirect(`https://${ADMIN_HOST}/`, 308);
      }
      if (pathname !== "/" && !isStudioPath(pathname) && SITE_URL) {
        return NextResponse.redirect(`${SITE_URL}${pathname}${search}`, 308);
      }
      if (process.env.STUDIO_DISABLED === "1" || !process.env.DATABASE_URL) {
        return studioOff(req);
      }
      return adminGate(req, ev);
    }
    if (isStudioPath(pathname) || isStudioApi(pathname)) {
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
