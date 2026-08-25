/**
 * The two emails an enquiry produces.
 *
 * One to the studio, which is a working document: everything needed to
 * decide what to do, and the means to do it without opening a laptop.
 * One to the enquirer, which is the first thing the practice ever sends
 * them and should read like it came from an architect rather than from a
 * form.
 */
import type { Identity } from "@/lib/content-defaults";
import { signLeadAction, actionLabel, EMAIL_ACTIONS } from "@/lib/lead-tokens";
import {
  button,
  buttonRow,
  C,
  card,
  esc,
  escMultiline,
  facts,
  footNote,
  formatIST,
  heading,
  label,
  layout,
  link,
  masthead,
  paragraph,
  quote,
  rule,
  spacer,
} from "@/lib/emails/shell";

export type LeadForEmail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  source: string | null;
  topic: string | null;
  budget: string | null;
  location: string | null;
  createdAt: Date;
};

const firstName = (full: string) => full.trim().split(/\s+/)[0] || full;

/** Digits only — what wa.me expects, from whatever the form was given. */
const waNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

/* ------------------------------------------------ studio notification */

export function notificationEmail(lead: LeadForEmail, identity: Identity, siteUrl: string) {
  const when = formatIST(lead.createdAt);

  // One-tap stage changes. "Contacted" is the overwhelmingly common next
  // step, so it gets the primary button and the rest stay quiet — an
  // email with four equally weighted buttons is an email where nobody
  // presses any of them.
  const actionHref = (a: (typeof EMAIL_ACTIONS)[number]) =>
    `${siteUrl}/api/leads/action?t=${encodeURIComponent(signLeadAction(lead.id, a))}`;

  const studioHref = `${siteUrl}/studio/leads?open=${encodeURIComponent(lead.id)}`;

  const detail = facts(
    [
      ["Looking for", lead.topic],
      ["Budget", lead.budget],
      ["Location", lead.location],
      ["Came from", lead.source],
    ].filter((r): r is [string, string] => Boolean(r[1])),
  );

  const contactLines = [
    `<a href="mailto:${esc(lead.email)}" style="color:${C.brass}; text-decoration:none; font-size:15px;">${esc(lead.email)}</a>`,
    lead.phone
      ? `<a href="tel:${esc(lead.phone.replace(/\s/g, ""))}" style="color:${C.brass}; text-decoration:none; font-size:15px;">${esc(lead.phone)}</a>`
      : "",
  ]
    .filter(Boolean)
    .join(`<span style="color:${C.hairline}; padding:0 10px;">|</span>`);

  const content =
    masthead(identity.shortName || identity.name, "New enquiry") +
    card(
      label(when) +
        heading(lead.name) +
        paragraph(contactLines, "padding-top:6px;") +
        (detail ? rule(22) + detail : "") +
        rule(22) +
        label("What they said") +
        quote(escMultiline(lead.message)) +
        rule(24) +
        buttonRow([
          button(actionHref("CONTACTED"), `Mark ${actionLabel("CONTACTED").toLowerCase()}`),
          ...(lead.phone
            ? [
                button(
                  `https://wa.me/${waNumber(lead.phone)}?text=${encodeURIComponent(
                    `Hello ${firstName(lead.name)}, thank you for your enquiry to ${identity.name}.`,
                  )}`,
                  "WhatsApp",
                  "secondary",
                ),
              ]
            : []),
          button(studioHref, "Open in Studio", "secondary"),
        ]) +
        spacer(4) +
        paragraph(
          `<span style="font-size:12px; color:${C.stone};">Or move it straight to ${EMAIL_ACTIONS.filter(
            (a) => a !== "CONTACTED",
          )
            .map((a) => link(actionHref(a), actionLabel(a)))
            .join(" · ")}</span>`,
        ),
    );

  const footer = footNote(
    `Replying to this email answers ${esc(firstName(lead.name))} directly.<br />
     Every enquiry is also waiting for you in ${link(`${siteUrl}/studio/leads`, "the studio dashboard", C.stone)}.`,
  );

  const text = [
    `New enquiry, ${lead.name}`,
    when,
    "",
    `Email: ${lead.email}`,
    lead.phone ? `Phone: ${lead.phone}` : "",
    lead.topic ? `Looking for: ${lead.topic}` : "",
    lead.budget ? `Budget: ${lead.budget}` : "",
    lead.location ? `Location: ${lead.location}` : "",
    lead.source ? `Came from: ${lead.source}` : "",
    "",
    "What they said:",
    lead.message,
    "",
    `Mark contacted: ${actionHref("CONTACTED")}`,
    `Open in Studio: ${studioHref}`,
    "",
    `Replying to this email answers ${firstName(lead.name)} directly.`,
  ]
    .filter((l) => l !== "")
    .join("\n");

  return {
    // The name leads the subject line, because the inbox truncates and
    // the name is the part worth reading in a notification list.
    subject: `${lead.name}, new enquiry${lead.topic ? ` (${lead.topic})` : ""}`,
    html: layout({
      preheader: `${lead.name}${lead.location ? `, ${lead.location}` : ""}, ${lead.message.slice(0, 90)}`,
      content,
      footer,
    }),
    text,
  };
}

/* --------------------------------------------- enquirer acknowledgement */

export function acknowledgementEmail(lead: LeadForEmail, identity: Identity, siteUrl: string) {
  const address = [identity.addressLine1, identity.addressLine2, `${identity.city} ${identity.pin}`]
    .filter(Boolean)
    .join(", ");

  const content =
    masthead(identity.shortName || identity.name, "Enquiry received") +
    card(
      heading(`Thank you, ${firstName(lead.name)}.`) +
        paragraph(
          `We have your enquiry and it is with ${esc(identity.principal)} now. You can expect a considered reply within one working day, not a form letter.`,
          "padding-top:10px;",
        ) +
        rule(24) +
        label("What you sent us") +
        quote(escMultiline(lead.message)) +
        (lead.topic || lead.location
          ? spacer(18) +
            facts(
              [
                ["Looking for", lead.topic],
                ["Location", lead.location],
              ].filter((r): r is [string, string] => Boolean(r[1])),
            )
          : "") +
        rule(24) +
        paragraph(
          `If it is easier to talk, we are on <a href="tel:${esc(identity.phone.replace(/\s/g, ""))}" style="color:${C.brass}; text-decoration:none;">${esc(identity.phone)}</a>${
            identity.whatsapp
              ? ` or <a href="https://wa.me/${esc(identity.whatsapp)}" style="color:${C.brass}; text-decoration:none;">WhatsApp</a>`
              : ""
          }.`,
        ) +
        spacer(20) +
        buttonRow([button(`${siteUrl}/projects`, "See our work", "secondary")]),
    );

  const footer = footNote(
    `${esc(identity.name)}<br />
     ${esc(address)}<br />
     <span style="color:${C.hairline};">·</span><br />
     You are receiving this because an enquiry was submitted at ${link(siteUrl, siteUrl.replace(/^https?:\/\//, ""), C.stone)}.`,
  );

  const text = [
    `Thank you, ${firstName(lead.name)}.`,
    "",
    `We have your enquiry and it is with ${identity.principal} now. You can expect a considered reply within one working day.`,
    "",
    "What you sent us:",
    lead.message,
    "",
    `If it is easier to talk, we are on ${identity.phone}.`,
    "",
    identity.name,
    address,
  ].join("\n");

  return {
    subject: `We have your enquiry, ${identity.shortName || identity.name}`,
    html: layout({
      preheader: `Thank you, ${identity.principal} will reply within one working day.`,
      content,
      footer,
    }),
    text,
  };
}
