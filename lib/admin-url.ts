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
