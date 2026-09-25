/**
 * Where the studio dashboard lives.
 *
 * In production the dashboard has its own host (ADMIN_HOST, e.g.
 * admin.designmattersarchitects.com) and the public site 404s /studio and
 * /login, so anything that links *into* the dashboard from outside it —
 * the enquiry emails, the one-tap confirmation page — must point here
 * rather than at the site URL. Without ADMIN_HOST (local dev, staging)
 * the dashboard is on the site's own host, so the fallback is `siteUrl`.
 */
export function studioOrigin(siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "") {
  const host = process.env.ADMIN_HOST?.trim();
  return host ? `https://${host}` : siteUrl;
}

/**
 * On the admin host the dashboard's front door is the bare origin: `/`
 * shows the sign-in form or, once signed in, the overview (middleware
 * rewrites it), so the address bar reads just the host. Without
 * ADMIN_HOST the old paths stand.
 */
const onAdminHost = () => Boolean(process.env.ADMIN_HOST?.trim());
export const studioHomePath = () => (onAdminHost() ? "/" : "/studio/dashboard");
export const loginPath = () => (onAdminHost() ? "/" : "/login");

/**
 * Where to send the studio after sign-in when they arrived via a deep
 * link (an enquiry email's /studio/leads, say). Middleware keeps it in
 * this short-lived cookie rather than a `?callbackUrl=` so the sign-in
 * address stays clean.
 */
export const RETURN_COOKIE = "dma_return";

/** Only a path inside the studio, never another host. */
export function safeReturnPath(value: string | undefined | null) {
  if (!value || value.includes("//") || value.includes("\\")) return null;
  return value === "/studio" || value.startsWith("/studio/") || value.startsWith("/studio?")
    ? value
    : null;
}
