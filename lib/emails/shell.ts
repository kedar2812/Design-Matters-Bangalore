/**
 * Email HTML primitives.
 *
 * Email is not the web. There is no flexbox, no grid, no webfont worth
 * relying on, and Outlook still renders through Word. So the structure is
 * nested tables with inline styles and explicit colours, and the one
 * `<style>` block only carries progressive extras (the phone layout),
 * which Gmail, Apple Mail and the iOS and Android apps all honour and
 * Outlook desktop ignores without breaking.
 *
 * The palette is lifted from `app/globals.css` rather than reinvented,
 * so the email that lands in Kiran's inbox is recognisably the same
 * studio as the site the enquiry came from. It is stated in hex here on
 * purpose: `var()` resolves nowhere useful in Gmail.
 *
 * Colours are declared light and every background and foreground is
 * named. Gmail and Outlook both apply their own dark-mode transforms, and
 * a palette that only names some of its colours gets the rest invented
 * for it, which is how warm bone turns into grey mud.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const C = {
  bone: "#f3efe7",
  boneDeep: "#ebe5d9",
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
  creamSoft: "#cfc6b5",
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

/* ---------------------------------------------------------------- brand */

/**
 * The studio's logo, when there is one.
 *
 * Drop a PNG at `public/email/logo.png` and every email picks it up; with
 * no file there, the masthead sets the name in type instead, so nothing
 * waits on the artwork. PNG only, because it is the one format every mail
 * client renders (SVG is stripped by Gmail and Outlook alike), and ideally
 * about three times the height it is shown at, for sharp phone screens.
 *
 * The image is served from the site rather than attached. An attachment
 * shows up as a paperclip in the inbox list, which reads as a document to
 * open rather than a notification to act on.
 */
export type Logo = { src: string; width: number; height: number };

const LOGO_FILE = path.join(process.cwd(), "public", "email", "logo.png");
/** Displayed height in CSS pixels. */
const LOGO_HEIGHT = 34;
const LOGO_MAX_WIDTH = 220;

export function emailLogo(siteUrl: string): Logo | null {
  try {
    if (!existsSync(LOGO_FILE)) return null;
    // Width and height live at fixed offsets in a PNG's IHDR chunk. Reading
    // them directly avoids loading an image library to size one picture.
    const head = readFileSync(LOGO_FILE).subarray(0, 24);
    if (head.toString("ascii", 12, 16) !== "IHDR") return null;
    const w = head.readUInt32BE(16);
    const h = head.readUInt32BE(20);
    if (!w || !h) return null;
    let height = LOGO_HEIGHT;
    let width = Math.round((w / h) * height);
    if (width > LOGO_MAX_WIDTH) {
      width = LOGO_MAX_WIDTH;
      height = Math.round((h / w) * width);
    }
    return { src: `${siteUrl}/email/logo.png`, width, height };
  } catch {
    return null;
  }
}

/* --------------------------------------------------------------- layout */

/**
 * The page wrapper: reset table, centred 600px column, and the
 * preheader, the grey line a phone shows under the subject. Left unset,
 * clients grab whatever text comes first, which is usually the studio
 * name repeated back at you.
 */
export function layout({
  preheader,
  content,
  title = "Design Matters Architects",
}: {
  preheader: string;
  content: string;
  title?: string;
}) {
  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${esc(title)}</title>
<style>
  a { text-decoration: none; }
  @media (max-width: 520px) {
    .px { padding-left: 22px !important; padding-right: 22px !important; }
    .stack { display: block !important; width: 100% !important; box-sizing: border-box; }
    .stack-gap { padding: 0 0 10px 0 !important; }
    .h-name { font-size: 28px !important; }
    /* Full-width buttons on a phone. The table stays a table: switching it
       to display:block wraps its rows in an anonymous shrink-to-fit table,
       and the pill keeps its desktop width. */
    .btn-wrap { display: block !important; padding-right: 0 !important; }
    .btn-table { display: table !important; width: 100% !important; }
    .btn-table a { display: block !important; text-align: center !important; }
    .hide-sm { display: none !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:${C.bone}; -webkit-font-smoothing:antialiased; -webkit-text-size-adjust:100%;">
<div style="display:none; font-size:1px; color:${C.bone}; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">${esc(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.bone};">
  <tr>
    <td align="center" style="padding:28px 12px 40px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;">
        ${content}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/**
 * The letterhead above the card: the logo (or the name set in type) on
 * the left, a quiet line of context on the right.
 */
export function brandBar({
  logo,
  studioName,
  aside,
  siteUrl,
}: {
  logo: Logo | null;
  studioName: string;
  aside?: string;
  siteUrl: string;
}) {
  const mark = logo
    ? `<img src="${esc(logo.src)}" width="${logo.width}" height="${logo.height}" alt="${esc(studioName)}" style="display:block; border:0; outline:none; width:${logo.width}px; height:${logo.height}px;" />`
    : // Only reached if public/email/logo.png is missing from a deploy.
      // The studio's name alone — no set-in tagline under it.
      `<span style="font-family:${SERIF}; font-size:21px; line-height:1; letter-spacing:-0.01em; color:${C.ink};">${esc(studioName)}</span>`;

  return `<tr>
  <td class="px" style="padding:0 6px 18px 6px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td valign="middle"><a href="${esc(siteUrl)}" style="text-decoration:none;">${mark}</a></td>
        ${
          aside
            ? `<td valign="middle" align="right" class="hide-sm" style="font-family:${SANS}; font-size:11px; letter-spacing:0.02em; color:${C.stone};">${esc(aside)}</td>`
            : ""
        }
      </tr>
    </table>
  </td>
</tr>`;
}

/**
 * The card: a dusk band carrying the headline, then the paper body.
 * Rounded, with the band's corners matched, which Outlook desktop squares
 * off and everything else renders as drawn.
 */
export function card({ band, body }: { band: string; body: string }) {
  return `<tr>
  <td style="background-color:${C.paper}; border:1px solid ${C.hairline}; border-radius:14px; overflow:hidden;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="px" style="background-color:${C.dusk}; background-image:linear-gradient(135deg, ${C.dusk} 0%, ${C.duskEdge} 100%); border-radius:13px 13px 0 0; padding:30px 34px 30px 34px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${band}
          </table>
        </td>
      </tr>
      <tr>
        <td class="px" style="padding:30px 34px 34px 34px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${body}
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

/* ---------------------------------------------------------- band pieces */

/** A small brass-outlined tag: "New enquiry", "Enquiry received". */
export const bandTag = (text: string) =>
  `<tr><td style="padding-bottom:16px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="border:1px solid ${C.brassBright}; border-radius:999px; padding:5px 12px; font-family:${SANS}; font-size:10px; line-height:1; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; color:${C.brassBright};">${esc(text)}</td>
    </tr></table>
  </td></tr>`;

export const bandTitle = (text: string) =>
  `<tr><td class="h-name" style="font-family:${SERIF}; font-size:34px; line-height:1.15; letter-spacing:-0.01em; color:${C.cream};">${esc(text)}</td></tr>`;

export const bandLine = (html: string) =>
  `<tr><td style="padding-top:10px; font-family:${SANS}; font-size:14px; line-height:1.6; color:${C.creamSoft};">${html}</td></tr>`;

/* ---------------------------------------------------------- body pieces */

export const label = (text: string) =>
  `<tr><td style="font-family:${SANS}; font-size:10px; font-weight:600; letter-spacing:0.16em; text-transform:uppercase; color:${C.stone}; padding-bottom:10px;">${esc(text)}</td></tr>`;

export const paragraph = (html: string, extra = "") =>
  `<tr><td style="font-family:${SANS}; font-size:15px; line-height:1.7; color:${C.inkSoft}; ${extra}">${html}</td></tr>`;

export const rule = (space = 24) =>
  `<tr><td style="padding:${space}px 0;"><div style="height:1px; background-color:${C.hairline}; line-height:1px; font-size:0;">&nbsp;</div></td></tr>`;

export const spacer = (h: number) =>
  `<tr><td style="height:${h}px; line-height:${h}px; font-size:0;">&nbsp;</td></tr>`;

/**
 * Somebody else's words, on a bone panel behind a brass margin rule, so
 * it is unmistakable where the enquirer stops and the studio starts.
 */
export const quote = (body: string) =>
  `<tr>
  <td>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.bone}; border-radius:10px;">
      <tr>
        <td width="3" style="width:3px; background-color:${C.brass}; border-radius:10px 0 0 10px; font-size:0; line-height:0;">&nbsp;</td>
        <td style="padding:18px 22px 18px 20px; font-family:${SERIF}; font-size:17px; line-height:1.7; color:${C.ink};">${body}</td>
      </tr>
    </table>
  </td>
</tr>`;

/**
 * The enquiry's particulars as tiles, two to a row, one to a row on a
 * phone. The value is what gets scanned, so it is the larger type.
 */
export function tiles(rows: [string, string][]) {
  if (rows.length === 0) return "";
  const tile = ([k, v]: [string, string]) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.bone}; border-radius:10px;">
      <tr><td style="padding:13px 16px 14px 16px;">
        <div style="font-family:${SANS}; font-size:10px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:${C.stone}; padding-bottom:5px;">${esc(k)}</div>
        <div style="font-family:${SANS}; font-size:15px; line-height:1.4; color:${C.ink};">${esc(v)}</div>
      </td></tr>
    </table>`;

  const lines: string[] = [];
  for (let i = 0; i < rows.length; i += 2) {
    const [a, b] = [rows[i], rows[i + 1]];
    lines.push(`<tr>
      <td class="stack stack-gap" width="50%" valign="top" style="width:50%; padding:0 5px 10px 0;">${tile(a)}</td>
      <td class="stack stack-gap" width="50%" valign="top" style="width:50%; padding:0 0 10px 5px;">${b ? tile(b) : "&nbsp;"}</td>
    </tr>`);
  }
  return `<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${lines.join("")}</table></td></tr>`;
}

/**
 * A button: a coloured cell wrapping a padded anchor. Not a styled `<a>`
 * alone, because several clients strip the padding and leave a bare blue
 * link where the call to action was.
 */
export function button(
  href: string,
  text: string,
  variant: "primary" | "secondary" = "primary",
) {
  const primary = variant === "primary";
  const bg = primary ? C.brass : C.paper;
  const fg = primary ? "#ffffff" : C.ink;
  const border = primary ? C.brass : C.hairline;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn-table" style="display:inline-block;">
    <tr>
      <td align="center" style="background-color:${bg}; border:1px solid ${border}; border-radius:999px;">
        <a href="${esc(href)}" style="display:inline-block; padding:12px 22px; font-family:${SANS}; font-size:14px; line-height:1; font-weight:600; color:${fg}; text-decoration:none; letter-spacing:0.01em; border-radius:999px;">${esc(text)}</a>
      </td>
    </tr>
  </table>`;
}

/** Buttons side by side, wrapping (and going full width) on a phone. */
export const buttonRow = (buttons: string[]) =>
  `<tr><td>${buttons
    .map((b) => `<span class="btn-wrap" style="display:inline-block; padding:0 8px 10px 0;">${b}</span>`)
    .join("")}</td></tr>`;

export const link = (href: string, text: string, color: string = C.brass) =>
  `<a href="${esc(href)}" style="color:${color}; text-decoration:none; border-bottom:1px solid ${C.hairline};">${esc(text)}</a>`;

/** Quiet closing block below the card, never inside it. */
export const footNote = (html: string) =>
  `<tr>
  <td style="padding:22px 28px 0 28px; font-family:${SANS}; font-size:12px; line-height:1.75; color:${C.stone}; text-align:center;">
    ${html}
  </td>
</tr>`;

/** Dates in the email are always Indian time, whatever the server thinks. */
export function formatIST(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

/** Shorten at a word boundary, so an excerpt never ends halfway through one. */
export function excerpt(text: string, max: number) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max + 1);
  const end = cut.lastIndexOf(" ");
  return `${(end > max * 0.6 ? cut.slice(0, end) : flat.slice(0, max)).replace(/[\s,;:.]+$/, "")}...`;
}

/** "3 hours", "2 days": how long something has been waiting. */
export function waited(since: Date, now = new Date()) {
  const hours = Math.max(0, Math.round((now.getTime() - since.getTime()) / 3_600_000));
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}
