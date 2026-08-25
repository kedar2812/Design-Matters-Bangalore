/**
 * The one-tap stage change from the notification email.
 *
 * GET performs the action, which is a deliberate choice with a known
 * cost: link scanners in some corporate mail systems fetch every URL in
 * a message, and one of those could move a lead to "Contacted" without a
 * human. The alternative — a confirmation page with a button — turns the
 * one gesture this feature exists for into two, on a phone, at a site
 * visit.
 *
 * That trade is acceptable only because of how narrow the action is: it
 * changes one enum column, it is reversible from the dashboard in a
 * click, and every use is written to the lead's timeline with the fact
 * that it came from an email link. Nothing here deletes, reads back a
 * list, or discloses anything the token holder was not already emailed.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { record } from "@/lib/lead-events";
import { actionLabel, verifyLeadAction } from "@/lib/lead-tokens";
import { STAGES } from "@/lib/lead-stages";
import { C, SANS, SERIF } from "@/lib/emails/shell";

// Stage changes must hit the database, never a cached route result.
export const dynamic = "force-dynamic";

const stageLabel = (v: string) => STAGES.find(([s]) => s === v)?.[1] ?? v;

/**
 * A whole page in one function, with no dependency on the site's layout
 * or fonts. This is the first thing that renders after a tap in a mail
 * app's in-app browser, where a slow shell reads as a broken link.
 */
function page({
  title,
  body,
  href,
  cta,
  tone = "good",
}: {
  title: string;
  body: string;
  href?: string;
  cta?: string;
  tone?: "good" | "bad";
}) {
  const accent = tone === "good" ? C.brass : "#8c3b2f";
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${title}</title>
<style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         background:${C.bone}; font-family:${SANS}; padding:24px; }
  .card { background:${C.paper}; border:1px solid ${C.hairline}; border-radius:4px;
          padding:40px 32px; max-width:420px; width:100%; text-align:center; }
  .mark { width:34px; height:3px; background:${accent}; margin:0 auto 22px; }
  h1 { font-family:${SERIF}; font-size:24px; line-height:1.25; color:${C.ink}; margin:0 0 10px; font-weight:400; }
  p { font-size:14px; line-height:1.65; color:${C.inkSoft}; margin:0; }
  a { display:inline-block; margin-top:26px; padding:11px 20px; background:${C.brass};
      color:#fff; text-decoration:none; border-radius:3px; font-size:13px; font-weight:600; }
</style></head>
<body><div class="card">
  <div class="mark"></div>
  <h1>${title}</h1>
  <p>${body}</p>
  ${href && cta ? `<a href="${href}">${cta}</a>` : ""}
</div></body></html>`;
}

const html = (body: string, status: number) =>
  new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  const verified = verifyLeadAction(token);

  if (!verified.ok) {
    const reason =
      verified.reason === "expired"
        ? "This link has expired. Enquiries stay in the dashboard, so nothing is lost — open it there instead."
        : "This link isn't valid. If you were sent it by email, open the enquiry in the dashboard instead.";
    return html(
      page({
        title: verified.reason === "expired" ? "Link expired" : "Link not recognised",
        body: reason,
        href: "/studio/leads",
        cta: "Open the dashboard",
        tone: "bad",
      }),
      verified.reason === "expired" ? 410 : 400,
    );
  }

  const lead = await prisma.lead.findUnique({
    where: { id: verified.leadId },
    select: { id: true, name: true, status: true },
  });

  if (!lead) {
    return html(
      page({
        title: "Enquiry not found",
        body: "It looks like this enquiry has since been deleted.",
        href: "/studio/leads",
        cta: "Open the dashboard",
        tone: "bad",
      }),
      404,
    );
  }

  const label = actionLabel(verified.action);
  const studioHref = `/studio/leads?open=${encodeURIComponent(lead.id)}`;

  // Tapping the same link twice — or a scanner having got there first —
  // is not an error and must not be reported as one.
  if (lead.status === verified.action) {
    return html(
      page({
        title: `Already ${label.toLowerCase()}`,
        body: `${lead.name}'s enquiry is already at “${label}”. Nothing has been changed.`,
        href: studioHref,
        cta: "Open the enquiry",
      }),
      200,
    );
  }

  const from = lead.status;
  await prisma.lead.update({
    where: { id: lead.id },
    data: { status: verified.action },
  });

  await record({
    leadId: lead.id,
    type: "EMAIL_ACTION",
    summary: `Moved from ${stageLabel(from)} to ${label} from the notification email`,
    meta: { from, to: verified.action, via: "email" },
  });

  return html(
    page({
      title: `Moved to ${label}`,
      body: `${lead.name}'s enquiry is now at “${label}”. The change is already in the dashboard.`,
      href: studioHref,
      cta: "Open the enquiry",
    }),
    200,
  );
}
