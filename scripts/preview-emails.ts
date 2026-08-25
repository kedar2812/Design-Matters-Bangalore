/**
 * Render the enquiry emails to disk so they can be looked at.
 *
 * Email templates are the one part of this codebase with no screen to
 * check them on — the feedback loop is otherwise "submit a real enquiry
 * and hope". This writes both messages, with a representative enquiry,
 * to .preview/ where a browser can open them.
 *
 *   npm run emails:preview
 *
 * Uses the built-in identity defaults rather than the database, so it
 * runs with nothing configured and no Postgres listening.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULTS } from "../lib/content-defaults";
import { acknowledgementEmail, notificationEmail, type LeadForEmail } from "../lib/emails/enquiry";

process.env.LEAD_ACTION_SECRET ??= "preview-only-secret-not-used-anywhere-real";

const lead: LeadForEmail = {
  id: "clpreview000000000000000",
  name: "Ananya Rao",
  email: "ananya.rao@example.com",
  phone: "+91 98450 22119",
  message:
    "We've bought a 40x60 corner site in Sahakar Nagar and want to build a home for three generations, my parents, us, and eventually our daughter.\n\nThe brief we keep coming back to is light and cross-ventilation; the rented flat we're in now gets neither. We loved the courtyard in your Vivek residence. Could we come and see you sometime this month?",
  source: "/projects/vivek-residence",
  topic: "Residential, new build",
  budget: "₹1.5–2 Cr",
  location: "Sahakar Nagar, Bengaluru",
  createdAt: new Date(),
};

const out = path.join(process.cwd(), ".preview");
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function main() {
  await mkdir(out, { recursive: true });

  const notice = notificationEmail(lead, DEFAULTS.identity, site);
  const ack = acknowledgementEmail(lead, DEFAULTS.identity, site);

  for (const [file, mail] of [
    ["notification", notice],
    ["acknowledgement", ack],
  ] as const) {
    await writeFile(path.join(out, `${file}.html`), mail.html, "utf8");
    await writeFile(path.join(out, `${file}.txt`), `${mail.subject}\n\n${mail.text}`, "utf8");
    console.log(`${file.padEnd(15)} ${mail.subject}`);
  }

  console.log(`\nWritten to ${out}`);
}

main();
