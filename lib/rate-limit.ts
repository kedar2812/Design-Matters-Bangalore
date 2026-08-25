/**
 * A small in-process rate limiter.
 *
 * Scope first, because the scope is the design: this runs on one pm2
 * process on one VPS, so a Map in memory is genuinely the state. It
 * resets on deploy and it would not survive a second instance — both
 * fine for what it guards, which is not a security boundary but Kiran's
 * inbox. The honeypot already turns away naive bots; this is what stops
 * one determined person, or one stuck submit button, from sending a
 * hundred enquiry emails in a minute.
 *
 * If the site ever runs more than one instance, this wants to become a
 * row in Postgres or a Redis counter. Until then anything heavier is
 * infrastructure bought for a problem nobody has.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Drop expired keys occasionally so a long-running process can't grow forever. */
function sweep(now: number) {
  if (buckets.size < 500) return;
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}

export type RateVerdict = { allowed: boolean; retryAfterSeconds: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateVerdict {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Caller IP as the proxy hands it over. Nginx sits in front on the VPS,
 * so the socket address is always 127.0.0.1 — the forwarded header is
 * the only thing that distinguishes one visitor from another. It is
 * client-supplied and therefore spoofable, which is precisely why this
 * limiter guards a mailbox and not anything that matters.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
