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
import { studioOrigin } from "@/lib/admin-url";
import {
  bandLine,
  bandTag,
  bandTitle,
  brandBar,
  button,
  buttonRow,
  C,
  card,
  emailLogo,
  esc,
  escMultiline,
  footNote,
  formatIST,
  label,
  layout,
  link,
  paragraph,
  quote,
  rule,
  SANS,
  spacer,
  tiles,
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

export const firstName = (full: string) => full.trim().split(/\s+/)[0] || full;

/** Digits only, which is what wa.me expects, from whatever the form was given. */
export const waNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

/**
 * Where on the site the enquiry was sent from, in words.
 *
 * The form records a short code ("home", "project:aadya-mane"). Knowing
 * someone wrote in from a particular house is worth a line in the email,
 * because it is usually the house they want something like.
 */
export function describeSource(source: string | null): string | null {
  if (!source) return null;
  const pages: Record<string, string> = {
    home: "Home page",
    about: "About page",
    services: "Services page",
    press: "Press page",
    testimonials: "Testimonials page",
    "contact-page": "Contact page",
  };
  if (pages[source]) return pages[source];
  const project = /^project:(.+)$/.exec(source)?.[1];
  if (project) {
    const title = project
      .split("-")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");
    return `${title} project page`;
  }
  return source.startsWith("/") ? source : null;
}

export const siteHost = (siteUrl: string) => siteUrl.replace(/^https?:\/\//, "");

/* ------------------------------------------------ studio notification */

export function notificationEmail(lead: LeadForEmail, identity: Identity, siteUrl: string) {
  const when = formatIST(lead.createdAt);
  const studioName = identity.shortName || identity.name;
  const from = describeSource(lead.source);

  // One-tap stage changes. "Contacted" is the overwhelmingly common next
  // step, so it gets the primary button and the rest stay quiet: an email
  // with four equally weighted buttons is an email where nobody presses
  // any of them.
  const actionHref = (a: (typeof EMAIL_ACTIONS)[number]) =>
    `${siteUrl}/api/leads/action?t=${encodeURIComponent(signLeadAction(lead.id, a))}`;

  const studioHref = `${studioOrigin(siteUrl)}/studio/leads?open=${encodeURIComponent(lead.id)}`;
  const replySubject = `Your enquiry to ${identity.name}`;
  const whatsappHref = lead.phone
    ? `https://wa.me/${waNumber(lead.phone)}?text=${encodeURIComponent(
        `Hello ${firstName(lead.name)}, this is ${identity.principal || identity.name} from ${identity.name}. Thank you for your enquiry.`,
      )}`
    : null;

  const particulars = tiles(
    [
      ["Looking for", lead.topic],
      ["Budget", lead.budget],
      ["Site location", lead.location],
      ["Sent from", from],
    ].filter((r): r is [string, string] => Boolean(r[1])),
  );

  const contact = [
    `<a href="mailto:${esc(lead.email)}" style="color:${C.cream}; text-decoration:none; border-bottom:1px solid ${C.duskEdge};">${esc(lead.email)}</a>`,
    lead.phone
      ? `<a href="tel:${esc(lead.phone.replace(/\s/g, ""))}" style="color:${C.cream}; text-decoration:none; border-bottom:1px solid ${C.duskEdge};">${esc(lead.phone)}</a>`
      : "",
  ]
    .filter(Boolean)
    .join(`<span style="color:${C.brassBright}; padding:0 10px;">&middot;</span>`);

  const band = bandTag("New enquiry") + bandTitle(lead.name) + bandLine(contact);

  const body =
    (particulars ? particulars + spacer(14) : "") +
    label("Their message") +
    quote(escMultiline(lead.message)) +
    spacer(26) +
    buttonRow([
      button(actionHref("CONTACTED"), "Mark as contacted"),
      ...(whatsappHref ? [button(whatsappHref, "Reply on WhatsApp", "secondary")] : []),
      button(`mailto:${lead.email}?subject=${encodeURIComponent(replySubject)}`, "Reply by email", "secondary"),
    ]) +
    rule(18) +
    `<tr><td style="font-family:${SANS}; font-size:13px; line-height:1.8; color:${C.stone};">
      Move it to ${EMAIL_ACTIONS.filter((a) => a !== "CONTACTED")
        .map((a) => link(actionHref(a), actionLabel(a)))
        .join(` <span style="color:${C.hairline};">&middot;</span> `)}
      <span style="color:${C.hairline};">&nbsp;|&nbsp;</span>
      ${link(studioHref, "Open in the dashboard")}
    </td></tr>`;

  const content =
    brandBar({ logo: emailLogo(siteUrl), studioName, aside: when, siteUrl }) +
    card({ band, body }) +
    footNote(
      `Hit reply and your answer goes straight to ${esc(firstName(lead.name))}.<br />
       The buttons work from your phone without signing in, for fourteen days.<br />
       Every enquiry is also kept in ${link(`${studioOrigin(siteUrl)}/studio/leads`, "the studio dashboard", C.stone)}.`,
    );

  const text = [
    `New enquiry: ${lead.name}`,
    when,
    "",
    `Email: ${lead.email}`,
    lead.phone ? `Phone: ${lead.phone}` : "",
    lead.topic ? `Looking for: ${lead.topic}` : "",
    lead.budget ? `Budget: ${lead.budget}` : "",
    lead.location ? `Site location: ${lead.location}` : "",
    from ? `Sent from: ${from}` : "",
    "",
    "Their message:",
    lead.message,
    "",
    `Mark as contacted: ${actionHref("CONTACTED")}`,
    whatsappHref ? `Reply on WhatsApp: ${whatsappHref}` : "",
    `Open in the dashboard: ${studioHref}`,
    "",
    `Hit reply and your answer goes straight to ${firstName(lead.name)}.`,
  ]
    .filter((l, i, all) => l !== "" || (all[i - 1] ?? "") !== "")
    .join("\n");

  return {
    // The name leads the subject line, because the inbox truncates and
    // the name is the part worth reading in a notification list.
    subject: `New enquiry from ${lead.name}${lead.topic ? ` · ${lead.topic}` : ""}`,
    html: layout({
      title: `New enquiry from ${lead.name}`,
      preheader: [lead.location, lead.budget, lead.message.replace(/\s+/g, " ").slice(0, 90)]
        .filter(Boolean)
        .join(" · "),
      content,
    }),
    text,
  };
}

/* --------------------------------------------- enquirer acknowledgement */

export function acknowledgementEmail(lead: LeadForEmail, identity: Identity, siteUrl: string) {
  const studioName = identity.shortName || identity.name;
  const address = [identity.addressLine1, identity.addressLine2, `${identity.city} ${identity.pin}`]
    .filter(Boolean)
    .join(", ");
  const principal = identity.principal || "the studio";
  const phoneHref = `tel:${identity.phone.replace(/\s/g, "")}`;

  const band =
    bandTag("Enquiry received") +
    bandTitle(`Thank you, ${firstName(lead.name)}.`) +
    bandLine(`Your message is with ${esc(principal)}, and you will hear back within one working day.`);

  // The farmhouse at dusk, pre-cut to 1200 x 600 in /public/email so it
  // arrives as a plain JPEG every mail client can show. It is the one
  // photograph in the email, and the first time most of these people see
  // the studio's work outside the website.
  const photo = `<tr><td style="padding-bottom:26px;">
    <a href="${esc(siteUrl)}/projects/praangana-heritage" style="text-decoration:none;">
      <img src="${esc(siteUrl)}/email/studio.jpg" width="530" alt="Praangana Heritage, a courtyard farmhouse by ${esc(identity.name)}" style="display:block; width:100%; max-width:530px; height:auto; border:0; border-radius:10px;" />
    </a>
  </td></tr>`;

  const recap = tiles(
    [
      ["Looking for", lead.topic],
      ["Site location", lead.location],
    ].filter((r): r is [string, string] => Boolean(r[1])),
  );

  const body =
    photo +
    label("What you sent us") +
    quote(escMultiline(lead.message)) +
    (recap ? spacer(12) + recap : spacer(8)) +
    rule(18) +
    paragraph(
      `If it is easier to talk, call us on <a href="${esc(phoneHref)}" style="color:${C.brass}; text-decoration:none; border-bottom:1px solid ${C.hairline};">${esc(identity.phone)}</a>${
        identity.whatsapp
          ? `, or send a message on <a href="https://wa.me/${esc(identity.whatsapp)}" style="color:${C.brass}; text-decoration:none; border-bottom:1px solid ${C.hairline};">WhatsApp</a>`
          : ""
      }. Replying to this email reaches the studio too.`,
    ) +
    spacer(20) +
    buttonRow([button(`${siteUrl}/projects`, "See the studio's work", "secondary")]);

  const content =
    brandBar({ logo: emailLogo(siteUrl), studioName, siteUrl }) +
    card({ band, body }) +
    footNote(
      `<strong style="color:${C.inkSoft}; font-weight:600;">${esc(identity.name)}</strong><br />
       ${esc(address)}<br />
       You are receiving this because you sent an enquiry at ${link(siteUrl, siteHost(siteUrl), C.stone)}.`,
    );

  const text = [
    `Thank you, ${firstName(lead.name)}.`,
    "",
    `Your message is with ${principal}, and you will hear back within one working day.`,
    "",
    "What you sent us:",
    lead.message,
    "",
    `If it is easier to talk, call us on ${identity.phone}. Replying to this email reaches the studio too.`,
    "",
    identity.name,
    address,
  ].join("\n");

  return {
    subject: `Thank you for your enquiry, ${firstName(lead.name)}`,
    html: layout({
      title: `Thank you, ${firstName(lead.name)}`,
      preheader: `Your message is with ${principal}. You will hear back within one working day.`,
      content,
    }),
    text,
  };
}
