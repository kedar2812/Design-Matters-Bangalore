/**
 * Email HTML primitives.
 *
 * Email is not the web. There is no stylesheet, no flexbox, no grid, no
 * webfont worth relying on, and Outlook still renders through Word. So
 * everything here is a nested table with inline styles and explicit
 * colours — the shape the site's CSS would take if you removed every
 * feature added after 2003.
 *
 * The palette is lifted from `app/globals.css` rather than reinvented,
 * so the email that lands in Kiran's inbox is recognisably the same
 * studio as the site the enquiry came from. It is stated in hex here on
 * purpose: `var()` resolves nowhere useful in Gmail.
 *
 * Colours are declared light and never inverted. Gmail and Outlook both
 * apply their own dark-mode transforms, and a palette that only names
 * some of its colours gets the rest invented for it — which is how warm
 * bone turns into grey mud. Naming every background and every foreground
 * is what keeps that from happening.
 */

export const C = {
  bone: "#f3efe7",
  paper: "#fbfaf6",
  ink: "#17150f",
  inkSoft: "#3d3a31",
  stone: "#6f6a60",
  hairline: "#dad4c8",
  brass: "#84663d",
  brassDeep: "#6b5232",
  dusk: "#201a12",
  duskEdge: "#3b3425",
  brassBright: "#c9a468",
  cream: "#f3efe7",
} as const;

// Fraunces and Inter are not available in mail clients. Georgia ships
// with every desktop and both mobile platforms and is the closest thing
// to Fraunces' warmth; the sans stack is the standard system ladder.
export const SERIF = "Georgia, 'Times New Roman', Times, serif";
export const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Anything interpolated into email HTML goes through here first. */
export function esc(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Preserve the enquirer's paragraph breaks without letting their markup through. */
export const escMultiline = (value: string) =>
  esc(value).replace(/\r?\n/g, "<br />");

/**
 * The page wrapper: reset table, centred 600px column, and the
 * preheader — the grey line of text a phone shows under the subject.
 * Left unset, clients grab whatever text comes first, which is usually
 * the studio name repeated back at you.
 */
export function layout({
  preheader,
  content,
  footer,
}: {
  preheader: string;
  content: string;
  footer: string;
}) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>Design Matters Architects</title>
</head>
<body style="margin:0; padding:0; background-color:${C.bone}; -webkit-font-smoothing:antialiased;">
<div style="display:none; font-size:1px; color:${C.bone}; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.bone};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;">
        ${content}
        ${footer}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** Dusk masthead — the site's dark register, used as the letterhead. */
export function masthead(studioName: string, eyebrow: string) {
  return `<tr>
  <td style="background-color:${C.dusk}; padding:22px 28px; border-radius:4px 4px 0 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="font-family:${SERIF}; font-size:15px; letter-spacing:0.02em; color:${C.cream};">
          ${esc(studioName)}
        </td>
        <td align="right" style="font-family:${SANS}; font-size:10px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:${C.brassBright};">
          ${esc(eyebrow)}
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

/** The paper card the letter is printed on. */
export const card = (inner: string) =>
  `<tr>
  <td style="background-color:${C.paper}; padding:32px 28px; border-left:1px solid ${C.hairline}; border-right:1px solid ${C.hairline}; border-bottom:1px solid ${C.hairline}; border-radius:0 0 4px 4px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${inner}
    </table>
  </td>
</tr>`;

export const label = (text: string) =>
  `<tr><td style="font-family:${SANS}; font-size:10px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:${C.stone}; padding-bottom:8px;">${esc(text)}</td></tr>`;

export const heading = (text: string) =>
  `<tr><td style="font-family:${SERIF}; font-size:28px; line-height:1.2; color:${C.ink}; padding-bottom:4px;">${esc(text)}</td></tr>`;

export const paragraph = (html: string, extra = "") =>
  `<tr><td style="font-family:${SANS}; font-size:14px; line-height:1.65; color:${C.inkSoft}; ${extra}">${html}</td></tr>`;

export const rule = (space = 24) =>
  `<tr><td style="padding:${space}px 0;"><div style="height:1px; background-color:${C.hairline}; line-height:1px; font-size:0;">&nbsp;</div></td></tr>`;

export const spacer = (h: number) =>
  `<tr><td style="height:${h}px; line-height:${h}px; font-size:0;">&nbsp;</td></tr>`;

/**
 * The message itself, set against a brass margin rule — the one place
 * in the email where somebody else's words appear, marked as such.
 */
export const quote = (body: string) =>
  `<tr>
  <td style="padding:2px 0 0 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="3" style="width:3px; background-color:${C.brass}; font-size:0; line-height:0;">&nbsp;</td>
        <td style="padding:2px 0 2px 16px; font-family:${SERIF}; font-size:16px; line-height:1.7; color:${C.ink};">${body}</td>
      </tr>
    </table>
  </td>
</tr>`;

/**
 * Definition rows (Looking for / Budget / Location). Two columns rather
 * than a list, because the value is what gets scanned and it wants to be
 * on one predictable left edge.
 */
export function facts(rows: [string, string][]) {
  if (rows.length === 0) return "";
  const cells = rows
    .map(
      ([k, v]) => `<tr>
      <td width="104" style="width:104px; padding:5px 12px 5px 0; font-family:${SANS}; font-size:11px; letter-spacing:0.06em; text-transform:uppercase; color:${C.stone}; vertical-align:top;">${esc(k)}</td>
      <td style="padding:5px 0; font-family:${SANS}; font-size:14px; color:${C.ink}; vertical-align:top;">${esc(v)}</td>
    </tr>`,
    )
    .join("");
  return `<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${cells}</table></td></tr>`;
}

/**
 * A button, as a background-coloured table cell wrapping a padded
 * anchor. Not a styled `<a>` alone: several clients strip the padding
 * and leave a bare blue link where the call to action was.
 */
export function button(href: string, text: string, variant: "primary" | "secondary" = "primary") {
  const primary = variant === "primary";
  const bg = primary ? C.brass : C.paper;
  const fg = primary ? "#ffffff" : C.ink;
  const border = primary ? C.brass : C.hairline;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;">
    <tr>
      <td align="center" style="background-color:${bg}; border:1px solid ${border}; border-radius:3px;">
        <a href="${esc(href)}" style="display:inline-block; padding:11px 20px; font-family:${SANS}; font-size:13px; font-weight:600; color:${fg}; text-decoration:none; letter-spacing:0.01em;">${esc(text)}</a>
      </td>
    </tr>
  </table>`;
}

/** Buttons sit side by side in a row that wraps on a narrow phone. */
export const buttonRow = (buttons: string[]) =>
  `<tr><td style="padding-top:4px;">${buttons
    .map((b) => `<span style="display:inline-block; padding:0 8px 8px 0;">${b}</span>`)
    .join("")}</td></tr>`;

/** Quiet closing block below the card — never inside it. */
export const footNote = (html: string) =>
  `<tr>
  <td style="padding:20px 28px 0 28px; font-family:${SANS}; font-size:11px; line-height:1.7; color:${C.stone}; text-align:center;">
    ${html}
  </td>
</tr>`;

export const link = (href: string, text: string, color: string = C.brass) =>
  `<a href="${esc(href)}" style="color:${color}; text-decoration:none; border-bottom:1px solid ${C.hairline};">${esc(text)}</a>`;

/** Dates in the email are always Indian time, whatever the server thinks. */
export function formatIST(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}
