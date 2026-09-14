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
import { reminderEmail } from "../lib/emails/reminder";

process.env.LEAD_ACTION_SECRET ??= "preview-only-secret-not-used-anywhere-real";

const lead: LeadForEmail = {
  id: "clpreview000000000000000",
  name: "Ananya Rao",
  email: "ananya.rao@example.com",
  phone: "+91 98450 22119",
  message:
    "We've bought a 40x60 corner site in Sahakar Nagar and want to build a home for three generations, my parents, us, and eventually our daughter.\n\nThe brief we keep coming back to is light and cross-ventilation; the rented flat we're in now gets neither. We loved the courtyard in your Vivek residence. Could we come and see you sometime this month?",
  source: "project:vivek-residence",
  topic: "New home",
  budget: "₹1.5 to 2 crore",
  location: "Sahakar Nagar, Bangalore",
  createdAt: new Date(),
};

const HOUR = 3_600_000;
const waiting: LeadForEmail[] = [
  { ...lead, createdAt: new Date(Date.now() - 52 * HOUR) },
  {
    id: "clpreview000000000000001",
    name: "Rahul Menon",
    email: "rahul.menon@example.com",
    phone: null,
    message: "Looking to redo the interiors of a 3BHK apartment in Whitefield, mostly the kitchen and living room. Would you take on a project of this size?",
    source: "services",
    topic: "Interiors",
    budget: null,
    location: "Whitefield, Bangalore",
    createdAt: new Date(Date.now() - 27 * HOUR),
  },
];

const out = path.join(process.cwd(), ".preview");
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function main() {
  await mkdir(out, { recursive: true });

  const notice = notificationEmail(lead, DEFAULTS.identity, site);
  const ack = acknowledgementEmail(lead, DEFAULTS.identity, site);

  for (const [file, mail] of [
    ["notification", notice],
    ["acknowledgement", ack],
    ["reminder", reminderEmail(waiting, DEFAULTS.identity, site)],
  ] as const) {
    await writeFile(path.join(out, `${file}.html`), mail.html, "utf8");
    await writeFile(path.join(out, `${file}.txt`), `${mail.subject}\n\n${mail.text}`, "utf8");
    console.log(`${file.padEnd(15)} ${mail.subject}`);
  }

  console.log(`\nWritten to ${out}`);
}

main();
