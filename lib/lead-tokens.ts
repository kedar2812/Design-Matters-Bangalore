/**
 * Signed one-tap links for the enquiry notification email.
 *
 * The point of these is that Kiran reads an enquiry on his phone at a
 * site visit and can move it to "Contacted" without finding his password
 * and logging into the dashboard. That only works if the link itself
 * carries the authority — hence an HMAC over exactly the three things
 * that matter: which lead, which action, and until when.
 *
 * What keeps this safe is the narrowness of what a token can do. It
 * names one lead, permits one stage change, expires, and every use is
 * written to that lead's timeline. It cannot read the enquiry list,
 * cannot delete anything, and cannot be edited into a token for a
 * different lead without the secret.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { STAGES } from "@/lib/lead-stages";

/** Stage changes reachable from an email. Deliberately not the full set. */
export const EMAIL_ACTIONS = ["CONTACTED", "DISCUSSION", "WON", "LOST"] as const;
export type EmailAction = (typeof EMAIL_ACTIONS)[number];

export const isEmailAction = (v: string): v is EmailAction =>
  (EMAIL_ACTIONS as readonly string[]).includes(v);

export const actionLabel = (a: EmailAction) =>
  STAGES.find(([s]) => s === a)?.[1] ?? a;

/** Links stay good for a fortnight — long enough for a holiday, short enough to expire. */
const TTL_MS = 14 * 24 * 60 * 60 * 1000;

function secret() {
  // AUTH_SECRET is already required for the site to run at all, so
  // falling back to it means these links work the moment the app boots
  // rather than silently producing dead buttons on a deploy where one
  // more variable was forgotten. Set LEAD_ACTION_SECRET to rotate the
  // links without invalidating everyone's sessions.
  const s = process.env.LEAD_ACTION_SECRET || process.env.AUTH_SECRET;
  if (!s) throw new Error("LEAD_ACTION_SECRET or AUTH_SECRET must be set to sign lead links");
  return s;
}

const b64url = (b: Buffer) => b.toString("base64url");

const sign = (payload: string) =>
  b64url(createHmac("sha256", secret()).update(payload).digest());

/** `<leadId>.<action>.<expiry>.<signature>` — opaque enough, and short. */
export function signLeadAction(leadId: string, action: EmailAction): string {
  const expires = Date.now() + TTL_MS;
  const payload = `${leadId}.${action}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export type VerifiedAction =
  | { ok: true; leadId: string; action: EmailAction }
  | { ok: false; reason: "malformed" | "expired" | "invalid" };

export function verifyLeadAction(token: string): VerifiedAction {
  const parts = token.split(".");
  if (parts.length !== 4) return { ok: false, reason: "malformed" };

  const [leadId, action, expires, signature] = parts;
  if (!leadId || !isEmailAction(action)) return { ok: false, reason: "malformed" };

  const expected = sign(`${leadId}.${action}.${expires}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  // Compare in constant time, and only after the lengths match —
  // timingSafeEqual throws on a length mismatch rather than returning false.
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "invalid" };
  }

  // Expiry is checked *after* the signature. Checking it first would let
  // anyone learn whether a guessed token was well-formed.
  const at = Number(expires);
  if (!Number.isFinite(at) || Date.now() > at) return { ok: false, reason: "expired" };

  return { ok: true, leadId, action };
}
