/**
 * The daily "still waiting for a reply" email.
 *
 * One message listing every enquiry that has sat at "New" too long, not
 * one message per enquiry: a reminder that arrives five times is five
 * reasons to set up a filter that hides all of them.
 */
import type { Identity } from "@/lib/content-defaults";
import { signLeadAction } from "@/lib/lead-tokens";
import {
  bandLine,
  bandTag,
  bandTitle,
  brandBar,
  button,
  C,
  card,
  emailLogo,
  esc,
  excerpt,
  footNote,
  formatIST,
  layout,
  link,
  SANS,
  SERIF,
  spacer,
  waited,
} from "@/lib/emails/shell";
import { describeSource, firstName, waNumber, type LeadForEmail } from "@/lib/emails/enquiry";

const NUMBER_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const count = (n: number) => NUMBER_WORDS[n] ?? String(n);

export function reminderEmail(
  leads: LeadForEmail[],
  identity: Identity,
  siteUrl: string,
  now = new Date(),
) {
  const studioName = identity.shortName || identity.name;
  const n = leads.length;
  const heading = `${count(n)} ${n === 1 ? "enquiry is" : "enquiries are"} waiting for a reply`;

  const row = (lead: LeadForEmail, i: number) => {
    const contacted = `${siteUrl}/api/leads/action?t=${encodeURIComponent(signLeadAction(lead.id, "CONTACTED"))}`;
    const open = `${siteUrl}/studio/leads?open=${encodeURIComponent(lead.id)}`;
    const reach = lead.phone
      ? button(
          `https://wa.me/${waNumber(lead.phone)}?text=${encodeURIComponent(
            `Hello ${firstName(lead.name)}, this is ${identity.principal || identity.name} from ${identity.name}. Thank you for your enquiry.`,
          )}`,
          "WhatsApp",
          "secondary",
        )
      : button(`mailto:${lead.email}`, "Email", "secondary");
    const details = [lead.topic, lead.location, describeSource(lead.source)].filter(Boolean).join(" · ");

    return `<tr><td style="${i > 0 ? `border-top:1px solid ${C.hairline}; ` : ""}padding:${i > 0 ? 22 : 0}px 0 22px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-family:${SERIF}; font-size:21px; line-height:1.25; color:${C.ink};">${esc(lead.name)}</td>
          <td align="right" valign="top" style="font-family:${SANS}; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:${C.brass}; white-space:nowrap; padding-left:12px;">Waiting ${esc(waited(lead.createdAt, now))}</td>
        </tr>
        ${details ? `<tr><td colspan="2" style="padding-top:4px; font-family:${SANS}; font-size:13px; color:${C.stone};">${esc(details)}</td></tr>` : ""}
        <tr><td colspan="2" style="padding-top:10px; font-family:${SANS}; font-size:14px; line-height:1.65; color:${C.inkSoft};">
          &ldquo;${esc(excerpt(lead.message, 180))}&rdquo;
        </td></tr>
        <tr><td colspan="2" style="padding-top:14px;">
          <span class="btn-wrap" style="display:inline-block; padding:0 8px 8px 0;">${button(contacted, "Mark as contacted")}</span>
          <span class="btn-wrap" style="display:inline-block; padding:0 8px 8px 0;">${reach}</span>
          <span class="btn-wrap" style="display:inline-block; padding:0 0 8px 0;">${button(open, "Open", "secondary")}</span>
        </td></tr>
      </table>
    </td></tr>`;
  };

  const band =
    bandTag("Reminder") +
    bandTitle(heading) +
    bandLine(
      n === 1
        ? "It is still marked New in the dashboard. Once you have been in touch, mark it contacted and it will not come up again."
        : "They are still marked New in the dashboard, oldest first. Mark each one contacted once you have been in touch and it drops off this list.",
    );

  const content =
    brandBar({ logo: emailLogo(siteUrl), studioName, aside: formatIST(now), siteUrl }) +
    card({ band, body: leads.map(row).join("") + spacer(2) }) +
    footNote(
      `Sent once a day while enquiries are waiting. Each one is mentioned at most three times.<br />
       Change this under ${link(`${siteUrl}/studio/alerts`, "Email alerts", C.stone)} in the dashboard.`,
    );

  const text = [
    heading,
    "",
    ...leads.flatMap((l) => [
      `${l.name} (waiting ${waited(l.createdAt, now)})`,
      [l.topic, l.location].filter(Boolean).join(" · "),
      `${l.email}${l.phone ? ` · ${l.phone}` : ""}`,
      `Mark as contacted: ${siteUrl}/api/leads/action?t=${encodeURIComponent(signLeadAction(l.id, "CONTACTED"))}`,
      "",
    ]),
    `Change reminders under Email alerts: ${siteUrl}/studio/alerts`,
  ]
    .filter((l, i, all) => l !== "" || (all[i - 1] ?? "") !== "")
    .join("\n");

  return {
    subject:
      n === 1
        ? `Reminder: ${leads[0].name} is waiting for a reply`
        : `Reminder: ${count(n).toLowerCase()} enquiries are waiting for a reply`,
    html: layout({
      title: heading,
      preheader: leads.map((l) => l.name).join(", "),
      content,
    }),
    text,
  };
}
