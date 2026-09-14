/**
 * Trigger for the daily enquiry reminder, called by cron on the server.
 *
 * Guarded by a shared secret in the Authorization header rather than by a
 * studio session, because nobody is signed in at ten in the morning when
 * it fires. Without `CRON_SECRET` set it refuses outright: an open
 * endpoint that sends the studio email on request is an endpoint someone
 * can use to fill their inbox.
 *
 * Safe to call more than once a day. `sendLeadReminders` skips anything
 * reminded in the last twenty hours, so a retry sends nothing twice.
 */
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sendLeadReminders } from "@/lib/lead-reminders";

export const dynamic = "force-dynamic";

function authorised(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(req: Request) {
  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (!authorised(req)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const outcome = await sendLeadReminders();
  console.log("[lead-reminders]", JSON.stringify(outcome));
  return NextResponse.json(outcome);
}
