/**
 * The second half of the dashboard's end-to-end check: everything that
 * `e2e-studio.ts` does not reach.
 *
 * Where that suite proves the studio's own buttons save, this one follows
 * the work that crosses from the public site into the studio and back out
 * again by email:
 *
 *   enquiry form -> lead row -> notification + acknowledgement emails ->
 *   one-tap stage link -> dashboard timeline -> daily reminder
 *
 * plus the alert settings, content editing reaching the live page, a
 * project edit that must not disturb anything it did not touch, review
 * visibility, uploads, analytics, sign-out and the enquiry rate limit.
 *
 * Mail is real SMTP, delivered to a sink this script runs on a local
 * port, so the whole path is exercised (nodemailer, the auth handshake,
 * MIME, headers) without a message leaving the machine. The app is a
 * production build it starts itself, with the sink configured, so it
 * never depends on how some other server happened to be launched.
 *
 * Everything it creates is removed, and everything it changes is put
 * back, including when an assertion throws halfway through. Local only,
 * for the same reason as `e2e-studio.ts`: it restores through
 * DATABASE_URL, which is not a remote deployment's database.
 *
 * Needs a fresh `npm run build`. Then:
 *   EMAIL=… PASSWORD=… OUT=<dir> npx tsx scripts/e2e-studio-extended.ts
 */
import "dotenv/config";
import { spawn, execSync, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import sharp from "sharp";
import { prisma } from "../lib/db";
import { DEFAULTS } from "../lib/content-defaults";

const PORT = Number(process.env.PORT ?? 3111);
const BASE = `http://localhost:${PORT}`;
const SMTP_PORT = Number(process.env.SMTP_SINK_PORT ?? 2526);
const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = process.env.OUT ?? ".";
const EMAIL = process.env.EMAIL ?? "";
const PASSWORD = process.env.PASSWORD ?? "";
const CRON_SECRET = "e2e-cron-secret-not-used-anywhere-real";
const RECIPIENT = "kiran@designmattersblr.com";
const TEST_DOMAIN = "e2e.test";

if (!EMAIL || !PASSWORD) {
  console.error("Set EMAIL and PASSWORD for a studio login.");
  process.exit(2);
}
if (!/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL ?? "")) {
  console.error("Refusing to run: DATABASE_URL is not a local database.");
  process.exit(2);
}

/* ------------------------------------------------------------ reporting */

const passed: string[] = [];
const failed: string[] = [];
const pageErrors: string[] = [];
const check = (cond: unknown, m: string) => {
  (cond ? passed : failed).push(m);
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${m}`);
};
const section = (title: string) => console.log(`\n-- ${title}`);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function until<T>(fn: () => Promise<T | null | undefined | false>, ms = 10000, every = 250) {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) return null;
    await wait(every);
  }
}

/* ------------------------------------------------------------ SMTP sink */

type Captured = {
  from: string;
  to: string[];
  subject: string;
  replyTo: string;
  html: string;
  text: string;
  authed: boolean;
};
const inbox: Captured[] = [];

function decodeQP(s: string) {
  const bytes: number[] = [];
  const src = s.replace(/=\r?\n/g, "");
  for (let i = 0; i < src.length; i++) {
    if (src[i] === "=" && /^[0-9A-F]{2}$/i.test(src.slice(i + 1, i + 3))) {
      bytes.push(parseInt(src.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(...Buffer.from(src[i], "utf8"));
    }
  }
  return Buffer.from(bytes).toString("utf8");
}

function decodeWords(s: string) {
  return s.replace(/=\?utf-8\?([QB])\?([^?]*)\?=\s*/gi, (_, enc: string, body: string) =>
    enc.toUpperCase() === "B"
      ? Buffer.from(body, "base64").toString("utf8")
      : decodeQP(body.replace(/_/g, " ")),
  );
}

function parseMime(raw: string) {
  const [head, ...rest] = raw.split(/\r?\n\r?\n/);
  const body = rest.join("\n\n");
  const headers = new Map<string, string>();
  for (const line of head.replace(/\r?\n[ \t]+/g, " ").split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) headers.set(line.slice(0, i).toLowerCase(), line.slice(i + 1).trim());
  }
  return { headers, body };
}

function partsOf(raw: string): { type: string; content: string }[] {
  const { headers, body } = parseMime(raw);
  const type = headers.get("content-type") ?? "text/plain";
  const boundary = /boundary="?([^";]+)"?/i.exec(type)?.[1];
  if (boundary) {
    return body
      .split(`--${boundary}`)
      .slice(1)
      .filter((p) => !p.startsWith("--"))
      .flatMap((p) => partsOf(p.replace(/^\r?\n/, "")));
  }
  const enc = (headers.get("content-transfer-encoding") ?? "").toLowerCase();
  const content =
    enc === "quoted-printable"
      ? decodeQP(body)
      : enc === "base64"
        ? Buffer.from(body.replace(/\s+/g, ""), "base64").toString("utf8")
        : body;
  return [{ type, content }];
}

function startSink(): Promise<net.Server> {
  const server = net.createServer((sock) => {
    let buf = "";
    let mode: "cmd" | "data" | "login-user" | "login-pass" = "cmd";
    let from = "";
    let to: string[] = [];
    let authed = false;
    const say = (l: string) => sock.write(l + "\r\n");
    say("220 e2e-sink ESMTP");
    sock.on("data", (chunk) => {
      buf += chunk.toString("utf8");
      for (;;) {
        if (mode === "data") {
          const end = buf.indexOf("\r\n.\r\n");
          if (end < 0) return;
          const raw = buf.slice(0, end).replace(/\r\n\.\./g, "\r\n.");
          buf = buf.slice(end + 5);
          const { headers } = parseMime(raw);
          const parts = partsOf(raw);
          inbox.push({
            from,
            to,
            subject: decodeWords(headers.get("subject") ?? ""),
            replyTo: headers.get("reply-to") ?? "",
            html: parts.find((p) => p.type.startsWith("text/html"))?.content ?? "",
            text: parts.find((p) => p.type.startsWith("text/plain"))?.content ?? "",
            authed,
          });
          from = "";
          to = [];
          mode = "cmd";
          say("250 OK queued");
          continue;
        }
        const nl = buf.indexOf("\r\n");
        if (nl < 0) return;
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 2);
        if (mode === "login-user") {
          mode = "login-pass";
          say("334 UGFzc3dvcmQ6");
          continue;
        }
        if (mode === "login-pass") {
          mode = "cmd";
          authed = true;
          say("235 Authenticated");
          continue;
        }
        const cmd = line.slice(0, 4).toUpperCase();
        if (cmd === "EHLO") {
          say("250-e2e-sink");
          say("250-AUTH PLAIN LOGIN");
          say("250 8BITMIME");
        } else if (cmd === "HELO") say("250 e2e-sink");
        else if (cmd === "AUTH") {
          if (/LOGIN/i.test(line)) {
            mode = "login-user";
            say("334 VXNlcm5hbWU6");
          } else {
            authed = true;
            say("235 Authenticated");
          }
        } else if (cmd === "MAIL") {
          from = /<([^>]*)>/.exec(line)?.[1] ?? "";
          say("250 OK");
        } else if (cmd === "RCPT") {
          to.push(/<([^>]*)>/.exec(line)?.[1] ?? "");
          say("250 OK");
        } else if (cmd === "DATA") {
          mode = "data";
          say("354 End data with <CR><LF>.<CR><LF>");
        } else if (cmd === "QUIT") {
          say("221 Bye");
          sock.end();
        } else say("250 OK");
      }
    });
    sock.on("error", () => {});
  });
  return new Promise((resolve) => server.listen(SMTP_PORT, "127.0.0.1", () => resolve(server)));
}

const mailTo = (address: string, since: number) =>
  inbox.slice(since).filter((m) => m.to.some((t) => t.toLowerCase() === address.toLowerCase()));

/** Email links point at NEXT_PUBLIC_SITE_URL; the test server is BASE. */
const localise = (href: string) => href.replace(/^https?:\/\/[^/]+/, BASE);

const hrefs = (html: string) =>
  [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));

/* ----------------------------------------------------------- app server */

function startApp(): ChildProcess {
  const child = spawn("npx", ["next", "start", "-p", String(PORT)], {
    shell: true,
    env: {
      ...process.env,
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: String(SMTP_PORT),
      SMTP_SECURE: "false",
      SMTP_USER: "studio-alerts@e2e.test",
      SMTP_PASS: "e2e app password",
      MAIL_FROM: "Design Matters Architects <studio-alerts@e2e.test>",
      RESEND_API_KEY: "",
      CRON_SECRET,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (d) => {
    const s = String(d);
    if (/error|fail/i.test(s)) process.stdout.write(`[app] ${s}`);
  });
  child.stderr?.on("data", (d) => process.stdout.write(`[app:err] ${d}`));
  return child;
}

function stopApp(child: ChildProcess) {
  try {
    if (process.platform === "win32") execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" });
    else child.kill("SIGTERM");
  } catch {
    /* already gone */
  }
}

/* --------------------------------------------------------- page helpers */

async function goto(page: Page, p: string) {
  await page.goto(BASE + p, { waitUntil: "networkidle2", timeout: 60000 });
}

async function clickText(page: Page, text: string, scope = "button, a") {
  return page.evaluate(
    `(() => {
      const t = ${JSON.stringify(text)};
      const el = [...document.querySelectorAll(${JSON.stringify(scope)})]
        // Exact text, allowing a trailing icon glyph such as the arrow on "Sign in".
        .find((e) => { const x = e.textContent.trim(); return !e.disabled && (x === t || (x.startsWith(t) && !/[a-z0-9]/i.test(x.slice(t.length)))); });
      if (!el) return false;
      el.scrollIntoView({ block: "center" });
      el.click();
      return true;
    })()`,
  ) as Promise<boolean>;
}

/** Set a React-controlled field so its onChange fires. */
async function setValue(page: Page, selector: string, value: string) {
  return page.evaluate(
    `(() => {
      const el = ${selector};
      if (!el) return false;
      const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype
        : el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${JSON.stringify(value)});
      el.dispatchEvent(new Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
      return true;
    })()`,
  ) as Promise<boolean>;
}

/** The input sitting under a visible field label in the studio forms. */
const byLabel = (label: string) =>
  `[...document.querySelectorAll("label, span, div")].filter((e) => e.children.length === 0 && e.textContent.trim() === ${JSON.stringify(label)})
     .map((e) => { let n = e; for (let i = 0; i < 4 && n; i++) { n = n.parentElement; const f = n && n.querySelector("input, textarea, select"); if (f) return f; } return null; })
     .find(Boolean)`;

const byValue = (value: string) =>
  `[...document.querySelectorAll("input, textarea")].find((e) => e.value === ${JSON.stringify(value)})`;

async function bodyText(p: string) {
  const res = await fetch(BASE + p, { cache: "no-store" });
  return { status: res.status, text: await res.text() };
}

async function submitEnquiry(
  page: Page,
  f: { name: string; email: string; phone?: string; message: string; location?: string; budget?: string; topic?: string; honeypot?: string },
) {
  await goto(page, "/contact");
  if (f.topic) await clickText(page, f.topic, "button");
  await setValue(page, `document.querySelector("#name")`, f.name);
  await setValue(page, `document.querySelector("#email")`, f.email);
  if (f.phone) await setValue(page, `document.querySelector("#phone")`, f.phone);
  if (f.location) await setValue(page, `document.querySelector("#location")`, f.location);
  if (f.budget) await page.select("#budget", f.budget);
  await setValue(page, `document.querySelector("textarea[name=message]")`, f.message);
  if (f.honeypot) await setValue(page, `document.querySelector("#company")`, f.honeypot);
  // The email field is type=email; skip the browser's own check so the
  // server-side validation is what gets tested.
  await page.evaluate(`document.querySelector("#email").closest("form").noValidate = true`);
  await clickText(page, "Send enquiry", "button");
  // Success replaces the form with a status panel; a refusal keeps the
  // form and adds an alert inside it.
  return until(
    () =>
      page.evaluate(
        `(() => {
          const ok = [...document.querySelectorAll("[role=status]")].find((e) => /Received/.test(e.textContent));
          if (ok) return ok.textContent.trim();
          const no = document.querySelector("form [role=alert]");
          return no && no.textContent.trim();
        })()`,
      ) as Promise<string | null>,
    15000,
  );
}

/* ------------------------------------------------------------------ run */

async function main() {
  const testStart = new Date();
  const created = { uploads: [] as string[] };

  // Everything this suite may change, recorded before it changes it.
  const priorSettings = await prisma.siteSetting.findMany({
    where: { key: { in: ["notifications", "services"] } },
  });
  const project = await prisma.project.findUniqueOrThrow({
    where: { slug: "aadya-mane" },
    include: { gallery: { orderBy: { order: "asc" } }, storyBlocks: { orderBy: { order: "asc" } } },
  });
  const review = await prisma.testimonial.findFirst({
    where: { published: true, featured: false },
    orderBy: { order: "asc" },
  });

  const sink = await startSink();
  const app = startApp();
  let browser: Browser | undefined;

  try {
    const up = await until(async () => (await fetch(BASE + "/login").catch(() => null))?.ok, 60000, 500);
    if (!up) throw new Error("app server did not start");

    browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 60000 });
    const page = await browser.newPage();
    // A native alert/confirm freezes the page for a real user's script too,
    // and the studio is meant to have none. Record and dismiss any that appear.
    page.on("dialog", async (d) => {
      failed.push(`native ${d.type()} dialog: "${d.message()}"`);
      console.log(`  FAIL  native ${d.type()} dialog: "${d.message()}"`);
      await d.dismiss().catch(() => {});
    });
    await page.setViewport({ width: 1440, height: 900 });
    page.on("pageerror", (e) => pageErrors.push(`${page.url()}: ${(e as Error).message}`));

    /* ------------------------------------------------------------ auth */
    section("Sign-in");
    await goto(page, "/login");
    await setValue(page, `document.querySelector("input[name=email]")`, EMAIL);
    await setValue(page, `document.querySelector("input[name=password]")`, "definitely-not-the-password");
    await clickText(page, "Sign in", "button");
    const loginError = await until(
      () => page.evaluate(`document.querySelector("[role=alert]")?.textContent`) as Promise<string | null>,
      15000,
    );
    check(page.url().includes("/login"), "a wrong password does not sign in");
    check(/don.t match/i.test(loginError ?? ""), "a wrong password shows an error");

    // The failed attempt reloads the page, so both fields start empty again.
    await setValue(page, `document.querySelector("input[name=email]")`, EMAIL);
    await setValue(page, `document.querySelector("input[name=password]")`, PASSWORD);
    await clickText(page, "Sign in", "button");
    await until(async () => page.url().includes("/studio"), 15000);
    check(page.url().includes("/studio"), "the right password signs in");

    /* ---------------------------------------------------------- alerts */
    section("Email alerts screen");
    await goto(page, "/studio/alerts");
    const alertsText = (await page.evaluate(`document.body.innerText`)) as string;
    check(/Connected/.test(alertsText), "delivery shows Connected when a sending account is configured");
    check(alertsText.includes("studio-alerts@e2e.test"), "the screen names the sending address");

    // Start from a clean list, then add the studio's inbox through the UI.
    await page.evaluate(
      `document.querySelectorAll('button[aria-label^="Remove"]').forEach((b) => b.click())`,
    );
    await clickText(page, "+ Add an address", "button");
    await setValue(page, `document.querySelector('input[type=email][aria-label="Email address"]')`, RECIPIENT);
    await clickText(page, "Save changes", "button");
    const savedRecipients = await until(async () => {
      const row = await prisma.siteSetting.findUnique({ where: { key: "notifications" } });
      const v = row?.value as { recipients?: string[] } | undefined;
      return v?.recipients?.includes(RECIPIENT) ? v : null;
    });
    check(savedRecipients, `recipient ${RECIPIENT} saved from the screen`);
    await goto(page, "/studio/alerts");
    check(
      ((await page.evaluate(`document.body.innerText`)) as string).includes(`emailed to ${RECIPIENT}`),
      "the screen states where the next enquiry will go",
    );

    let mark = inbox.length;
    await clickText(page, "Send a test email", "button");
    const testMail = await until(async () => mailTo(RECIPIENT, mark).find((m) => m.subject.startsWith("Test:")));
    check(testMail, "Send a test email delivers to the recipient");
    check(testMail?.authed, "the SMTP session authenticated");

    // Reminder interval: change, save, confirm, put back.
    await setValue(page, `document.querySelector('select[aria-label^="How long"]')`, "48");
    await clickText(page, "Save changes", "button");
    check(
      await until(async () => {
        const v = (await prisma.siteSetting.findUnique({ where: { key: "notifications" } }))?.value as
          | { remindAfterHours?: number }
          | undefined;
        return v?.remindAfterHours === 48;
      }),
      "reminder interval saves",
    );
    await goto(page, "/studio/alerts");
    await setValue(page, `document.querySelector('select[aria-label^="How long"]')`, "24");
    await clickText(page, "Save changes", "button");
    await until(async () => {
      const v = (await prisma.siteSetting.findUnique({ where: { key: "notifications" } }))?.value as
        | { remindAfterHours?: number }
        | undefined;
      return v?.remindAfterHours === 24;
    });

    /* ------------------------------------------------ public enquiry */
    section("Enquiry from the website");
    const visitor = browser.createBrowserContext ? await browser.createBrowserContext() : null;
    const pub = visitor ? await visitor.newPage() : page;
    await pub.setViewport({ width: 1280, height: 900 });
    pub.on("pageerror", (e) => pageErrors.push(`${pub.url()}: ${(e as Error).message}`));

    const first = {
      name: "Meera Iyer (e2e)",
      email: `meera@${TEST_DOMAIN}`,
      phone: "98450 11223",
      topic: "New home",
      budget: "₹1 to 2 crore",
      location: "Jayanagar, Bangalore",
      message: "We have a 30x40 site in Jayanagar and would like to build a home for four.\nCould we visit the studio next week?",
    };
    mark = inbox.length;
    const thanks = await submitEnquiry(pub, first);
    check(/Received/i.test(thanks ?? ""), "the visitor sees the confirmation");

    const lead = await until(() => prisma.lead.findFirst({ where: { email: first.email } }));
    check(lead, "the enquiry is stored as a lead");
    check(
      lead?.topic === first.topic && lead?.budget === first.budget && lead?.location === first.location,
      "topic, budget and location are stored in their own columns",
    );
    check(lead?.source === "contact-page" && lead?.status === "NEW", "source and stage are recorded");

    const notice = await until(async () => mailTo(RECIPIENT, mark).find((m) => m.subject.includes(first.name)));
    check(notice, "the studio is emailed about the enquiry");
    check(notice?.replyTo.includes(first.email), "replying to the alert writes to the enquirer");
    check(notice?.html.includes("Mark as contacted"), "the alert carries the one-tap button");
    check(notice?.html.includes("Jayanagar, Bangalore") && notice?.html.includes("₹1 to 2 crore"), "the alert shows location and budget");
    check(notice?.text.includes("Could we visit the studio"), "the alert has a plain-text part");
    check(!/[—–]/.test(notice?.html ?? "—"), "the alert contains no long dashes");

    const ack = await until(async () => mailTo(first.email, mark)[0]);
    check(ack && /Thank you/.test(ack.subject), "the enquirer receives an acknowledgement");

    const events = await until(async () => {
      const e = await prisma.leadEvent.findMany({ where: { leadId: lead!.id } });
      const types = e.map((x) => x.type);
      return types.includes("NOTIFIED") && types.includes("ACKNOWLEDGED") ? types : null;
    });
    check(events?.includes("RECEIVED"), "timeline: received, notified and acknowledged");
    check((await prisma.lead.findUnique({ where: { id: lead!.id } }))?.notifiedAt, "lead is marked as notified");

    for (const src of hrefs(ack?.html ?? "").filter((h) => /\/email\//.test(h)).concat(
      [...(ack?.html ?? "").matchAll(/src="([^"]+)"/g)].map((m) => m[1]),
    )) {
      const res = await fetch(localise(src));
      check(res.ok, `email image loads: ${new URL(localise(src)).pathname}`);
    }

    /* ------------------------------------------------ one-tap link */
    section("One-tap stage link");
    const contactedHref = hrefs(notice?.html ?? "").find((h) => h.includes("/api/leads/action"));
    check(contactedHref, "the alert contains a signed action link");
    if (contactedHref) {
      const tampered = localise(contactedHref).replace(/.(?=$)/, (c) => (c === "A" ? "B" : "A"));
      const bad = await fetch(tampered);
      check(bad.status === 400, "a tampered link is refused");
      check((await prisma.lead.findUnique({ where: { id: lead!.id } }))?.status === "NEW", "a tampered link changes nothing");

      const good = await fetch(localise(contactedHref));
      check(good.ok, "the genuine link succeeds");
      check((await prisma.lead.findUnique({ where: { id: lead!.id } }))?.status === "CONTACTED", "the lead moves to Contacted");
      check(
        await prisma.leadEvent.findFirst({ where: { leadId: lead!.id, type: "EMAIL_ACTION" } }),
        "the email action is written to the timeline",
      );
    }

    await goto(page, `/studio/leads?open=${lead!.id}`);
    const panel = (await page.evaluate(`document.body.innerText`)) as string;
    check(panel.includes(first.email) && panel.includes("Jayanagar"), "the enquiry opens in the dashboard");
    check(/Notification emailed to/.test(panel), "the dashboard shows it was emailed");

    /* --------------------------------------- acknowledgement switched off */
    section("Alert switches");
    await goto(page, "/studio/alerts");
    await clickText(page, "Send the enquirer a confirmation", "span");
    await clickText(page, "Save changes", "button");
    await until(async () => {
      const v = (await prisma.siteSetting.findUnique({ where: { key: "notifications" } }))?.value as
        | { acknowledgeEnquirer?: boolean }
        | undefined;
      return v?.acknowledgeEnquirer === false;
    });
    const second = { name: "Arjun Rao (e2e)", email: `arjun@${TEST_DOMAIN}`, message: "Interiors for a 3BHK in Whitefield, kitchen and living room." };
    mark = inbox.length;
    await submitEnquiry(pub, second);
    check(await until(async () => mailTo(RECIPIENT, mark).find((m) => m.subject.includes(second.name))), "with confirmations off, the studio is still emailed");
    await wait(2500);
    check(mailTo(second.email, mark).length === 0, "with confirmations off, the enquirer gets nothing");

    // Alerts off entirely.
    await goto(page, "/studio/alerts");
    await clickText(page, "Send the enquirer a confirmation", "span");
    await clickText(page, "Email the studio when an enquiry arrives", "span");
    await clickText(page, "Save changes", "button");
    await until(async () => {
      const v = (await prisma.siteSetting.findUnique({ where: { key: "notifications" } }))?.value as
        | { notifyStudio?: boolean; acknowledgeEnquirer?: boolean }
        | undefined;
      return v?.notifyStudio === false && v?.acknowledgeEnquirer === true;
    });
    const third = { name: "Farah Khan (e2e)", email: `farah@${TEST_DOMAIN}`, message: "A consultation about a plot in Hebbal before we buy it." };
    mark = inbox.length;
    await submitEnquiry(pub, third);
    const thirdLead = await until(() => prisma.lead.findFirst({ where: { email: third.email } }));
    check(
      await until(() => prisma.leadEvent.findFirst({ where: { leadId: thirdLead!.id, type: "NOTIFY_SKIPPED" } })),
      "with alerts off, the enquiry is recorded as deliberately not emailed",
    );
    check(mailTo(RECIPIENT, mark).length === 0, "with alerts off, no alert is sent");

    // Alerts back on; a lead whose earlier send failed can be sent by hand.
    await goto(page, "/studio/alerts");
    await clickText(page, "Email the studio when an enquiry arrives", "span");
    await clickText(page, "Save changes", "button");
    await until(async () => {
      const v = (await prisma.siteSetting.findUnique({ where: { key: "notifications" } }))?.value as
        | { notifyStudio?: boolean }
        | undefined;
      return v?.notifyStudio === true;
    });
    await prisma.lead.update({ where: { id: thirdLead!.id }, data: { notifyError: "simulated outage (e2e)" } });
    await goto(page, `/studio/leads?open=${thirdLead!.id}`);
    mark = inbox.length;
    check(await clickText(page, "Send it now", "button"), "a failed enquiry offers Send it now");
    check(await until(async () => mailTo(RECIPIENT, mark).find((m) => m.subject.includes(third.name))), "Send it now delivers the alert");
    check(
      await until(async () => (await prisma.lead.findUnique({ where: { id: thirdLead!.id } }))?.notifiedAt),
      "the failure clears once it is sent",
    );

    /* ------------------------------------------------------ validation */
    section("Form validation");
    const invalid = await submitEnquiry(pub, { name: "Bad Email (e2e)", email: "not-an-email", message: "hello there, this is long enough" });
    check(invalid && !/Received/i.test(invalid), "an invalid email is rejected with a message");
    const kept = (await pub.evaluate(
      `[document.querySelector("#name")?.value, document.querySelector("textarea[name=message]")?.value]`,
    )) as string[];
    check(kept[0] === "Bad Email (e2e)" && kept[1] === "hello there, this is long enough", "a refused enquiry keeps what the visitor typed");
    check(!(await prisma.lead.findFirst({ where: { name: "Bad Email (e2e)" } })), "an invalid enquiry is not stored");
    await submitEnquiry(pub, { name: "Bot (e2e)", email: `bot@${TEST_DOMAIN}`, message: "buy followers now please", honeypot: "Acme Corp" });
    await wait(1500);
    check(!(await prisma.lead.findFirst({ where: { email: `bot@${TEST_DOMAIN}` } })), "a filled honeypot is silently discarded");

    /* ------------------------------------------------------- reminders */
    section("Daily reminder");
    const stale = await prisma.lead.create({
      data: {
        name: "Waiting Wilson (e2e)",
        email: `wilson@${TEST_DOMAIN}`,
        phone: "9845000000",
        message: "Looking for an architect for a farmhouse near Kanakapura.",
        topic: "New home",
        location: "Kanakapura",
        source: "home",
        createdAt: new Date(Date.now() - 30 * 3_600_000),
      },
    });
    const cron = (auth?: string) =>
      fetch(BASE + "/api/cron/lead-reminders", {
        method: "POST",
        headers: auth ? { Authorization: auth } : {},
      });
    check((await cron()).status === 401, "the reminder endpoint refuses a call with no secret");
    check((await cron("Bearer wrong")).status === 401, "the reminder endpoint refuses a wrong secret");
    mark = inbox.length;
    const run1 = await cron(`Bearer ${CRON_SECRET}`);
    const out1 = (await run1.json()) as { sent: boolean; count: number };
    check(run1.ok && out1.sent && out1.count >= 1, "the reminder runs with the secret");
    const digest = await until(async () => mailTo(RECIPIENT, mark).find((m) => m.subject.startsWith("Reminder")));
    check(digest?.html.includes("Waiting Wilson"), "the reminder lists the waiting enquiry");
    check(!digest?.html.includes("Meera Iyer"), "an enquiry already contacted is not in the reminder");
    check(
      await prisma.leadEvent.findFirst({ where: { leadId: stale.id, type: "REMINDED" } }),
      "the reminder is written to the lead's timeline",
    );
    mark = inbox.length;
    const out2 = (await (await cron(`Bearer ${CRON_SECRET}`)).json()) as { sent: boolean };
    await wait(1000);
    check(!out2.sent && mailTo(RECIPIENT, mark).length === 0, "a second run the same day sends nothing");

    /* ---------------------------------------------------- content edit */
    section("Website content editing");
    const heading = DEFAULTS.services.heading;
    await goto(page, "/studio/content/services");
    check(await setValue(page, byValue(heading), "Three ways to work with us (e2e)."), "the services heading is editable");
    await clickText(page, "Save changes", "button");
    check(await until(async () => (await bodyText("/services")).text.includes("Three ways to work with us (e2e).")), "a content edit appears on the live page");
    await goto(page, "/studio/content/services");
    await clickText(page, "Restore original wording", "button");
    check(
      await until(() => page.evaluate(`!!document.querySelector("[role=alertdialog]")`) as Promise<boolean>, 5000),
      "restoring asks through the studio's own dialog",
    );
    await clickText(page, "Restore original", "[role=alertdialog] button");
    check(await until(async () => (await bodyText("/services")).text.includes(heading), 15000), "Restore original wording puts the page back");

    await goto(page, "/studio/content/home");
    // One photograph path per slide; the fallback word list above the
    // slideshow has words but no photographs, so it is not counted.
    const slideImages = (await page.evaluate(
      `[...document.querySelectorAll("input")].map((i) => i.value).filter((v) => /^\\/uploads\\/projects\\/[^/]+\\/(slide-\\d+|hero)\\.jpg$/.test(v))`,
    )) as string[];
    check(slideImages.length === 7, "the home page editor shows all seven hero slides");

    /* ---------------------------------------------------- project edit */
    section("Project editing");
    await goto(page, `/studio/projects/${project.id}`);
    check(await setValue(page, byLabel("Status"), "Completed in 2024 (e2e)"), "the Status field is editable");
    await clickText(page, "Save & publish", "button");
    check(
      await until(async () => (await prisma.project.findUnique({ where: { id: project.id } }))?.statusNote === "Completed in 2024 (e2e)"),
      "the project edit saves",
    );
    check(await until(async () => (await bodyText("/projects/aadya-mane")).text.includes("Completed in 2024 (e2e)")), "the edit appears on the project page");
    await goto(page, `/studio/projects/${project.id}`);
    await setValue(page, byLabel("Status"), project.statusNote ?? "");
    await clickText(page, "Save & publish", "button");
    await until(async () => (await prisma.project.findUnique({ where: { id: project.id } }))?.statusNote === project.statusNote);
    const after = await prisma.project.findUniqueOrThrow({
      where: { id: project.id },
      include: { gallery: { orderBy: { order: "asc" } }, storyBlocks: { orderBy: { order: "asc" } } },
    });
    const same = (k: keyof typeof project) => JSON.stringify(after[k]) === JSON.stringify(project[k]);
    const drift = (
      ["slug", "title", "category", "year", "location", "typology", "area", "siteArea", "client", "photographer", "collaborator", "units", "statusNote", "heroImage", "heroBlur", "status", "order", "metaTitle", "metaDesc"] as const
    ).filter((k) => !same(k));
    check(drift.length === 0, `saving a project leaves untouched fields alone${drift.length ? ` (changed: ${drift.join(", ")})` : ""}`);
    check(
      JSON.stringify(after.gallery.map((g) => [g.url, g.alt, g.order])) ===
        JSON.stringify(project.gallery.map((g) => [g.url, g.alt, g.order])),
      "saving a project keeps its gallery exactly",
    );
    check(
      JSON.stringify(after.storyBlocks.map((s) => [s.type, s.text, s.order])) ===
        JSON.stringify(project.storyBlocks.map((s) => [s.type, s.text, s.order])),
      "saving a project keeps its story blocks exactly",
    );

    /* ---------------------------------------------------- testimonials */
    section("Reviews");
    if (review) {
      await goto(page, "/studio/testimonials");
      const hide = await page.evaluate(
        `(() => {
          const row = [...document.querySelectorAll("a[href='/studio/testimonials/${review.id}']")][0]?.closest("li, div");
          const btn = row && [...row.querySelectorAll("button")].find((b) => b.textContent.trim() === "On site");
          if (!btn) return false; btn.click(); return true;
        })()`,
      );
      check(hide, "a review can be hidden from the list");
      check(await until(async () => (await prisma.testimonial.findUnique({ where: { id: review.id } }))?.published === false), "hiding a review saves");
      check(await until(async () => !(await bodyText("/testimonials")).text.includes(review.author), 15000), "a hidden review leaves the testimonials page");
      await goto(page, "/studio/testimonials");
      await page.evaluate(
        `(() => {
          const row = [...document.querySelectorAll("a[href='/studio/testimonials/${review.id}']")][0]?.closest("li, div");
          const btn = row && [...row.querySelectorAll("button")].find((b) => b.textContent.trim() === "Hidden");
          btn && btn.click();
        })()`,
      );
      check(await until(async () => (await prisma.testimonial.findUnique({ where: { id: review.id } }))?.published === true), "the review can be put back on the site");
    }

    /* --------------------------------------------------------- uploads */
    section("Uploads");
    const jpeg = await sharp({ create: { width: 800, height: 600, channels: 3, background: "#a2762f" } }).jpeg().toBuffer();
    const png = await sharp({ create: { width: 300, height: 300, channels: 4, background: "#20201a" } }).png().toBuffer();
    const upload = (b64: string, name: string, type: string) =>
      page.evaluate(
        `(async () => {
          const bytes = Uint8Array.from(atob(${JSON.stringify(b64)}), (c) => c.charCodeAt(0));
          const fd = new FormData();
          fd.append("file", new File([bytes], ${JSON.stringify(name)}, { type: ${JSON.stringify(type)} }));
          const r = await fetch("/api/upload", { method: "POST", body: fd });
          return { status: r.status, body: await r.json().catch(() => null) };
        })()`,
      ) as Promise<{ status: number; body: { url?: string; blurData?: string; error?: string } | null }>;

    const u1 = await upload(jpeg.toString("base64"), "E2E Test Photo.jpg", "image/jpeg");
    check(u1.status === 200 && u1.body?.url && u1.body.blurData, "a JPEG uploads and returns a blur placeholder");
    if (u1.body?.url) {
      created.uploads.push(u1.body.url);
      check((await fetch(BASE + u1.body.url)).ok, "a fresh upload is served straight away, without a restart");
      const optimised = await fetch(`${BASE}/_next/image?url=${encodeURIComponent(u1.body.url)}&w=640&q=75`);
      check(optimised.ok, "a fresh upload also works through the image optimiser");
    }
    const u2 = await upload(png.toString("base64"), "logo.png", "image/png");
    check(u2.status === 200, "a PNG uploads");
    if (u2.body?.url) created.uploads.push(u2.body.url);
    const u3 = await upload(Buffer.from("this is not an image at all").toString("base64"), "notes.jpg", "image/jpeg");
    check(u3.status === 415, "a file that is not an image is refused");
    const anon = new FormData();
    anon.append("file", new File([jpeg], "x.jpg", { type: "image/jpeg" }));
    check((await fetch(BASE + "/api/upload", { method: "POST", body: anon })).status === 401, "uploads require a signed-in user");

    /* ------------------------------------------------------- analytics */
    section("Analytics");
    const collect = (body: object, ua = "Mozilla/5.0 (Windows NT 10.0) Chrome/126") =>
      fetch(BASE + "/api/collect", { method: "POST", headers: { "Content-Type": "application/json", "User-Agent": ua }, body: JSON.stringify(body) });
    await collect({ path: "/e2e-probe" });
    await collect({ path: "/studio/dashboard" });
    await collect({ path: "/e2e-probe-bot" }, "Googlebot/2.1");
    check(await until(() => prisma.pageView.findFirst({ where: { path: "/e2e-probe" } })), "a page view is recorded");
    check(!(await prisma.pageView.findFirst({ where: { path: "/studio/dashboard", createdAt: { gte: testStart } } })), "studio pages are never recorded");
    check(!(await prisma.pageView.findFirst({ where: { path: "/e2e-probe-bot" } })), "crawlers are not recorded");

    /* ------------------------------------------------------ rate limit */
    section("Enquiry rate limit");
    // Four submissions so far from this address reached the limiter
    // (the honeypot is turned away before it). The fifth is allowed.
    await submitEnquiry(pub, { name: "Fifth (e2e)", email: `fifth@${TEST_DOMAIN}`, message: "The fifth enquiry from one address this hour." });
    const sixth = await submitEnquiry(pub, { name: "Sixth (e2e)", email: `sixth@${TEST_DOMAIN}`, message: "The sixth enquiry from one address this hour." });
    check(/few enquiries from here/i.test(sixth ?? ""), "the sixth enquiry in an hour is politely refused");
    check(!(await prisma.lead.findFirst({ where: { email: `sixth@${TEST_DOMAIN}` } })), "a rate-limited enquiry is not stored");

    /* -------------------------------------------------------- sign out */
    section("Sign-out");
    await goto(page, "/studio/dashboard");
    await clickText(page, "Sign out", "button");
    await until(async () => page.url().includes("/login"), 10000);
    check(page.url().includes("/login"), "Sign out returns to the login page");
    await goto(page, "/studio/leads");
    check(page.url().includes("/login"), "after signing out the studio is locked again");

    await page.screenshot({ path: path.join(OUT, "e2e-extended-end.png") });
  } finally {
    section("Cleanup");
    await browser?.close().catch(() => {});
    stopApp(app);
    sink.close();

    const removed = await prisma.lead.deleteMany({ where: { email: { endsWith: `@${TEST_DOMAIN}` } } });
    await prisma.leadEvent.deleteMany({ where: { type: "REMINDED", createdAt: { gte: testStart } } });
    await prisma.pageView.deleteMany({ where: { path: { startsWith: "/e2e-probe" } } });
    await prisma.siteSetting.deleteMany({ where: { key: { in: ["notifications", "services"] } } });
    for (const s of priorSettings) {
      await prisma.siteSetting.create({ data: { key: s.key, value: s.value as object } });
    }
    await prisma.project.update({ where: { id: project.id }, data: { statusNote: project.statusNote } });
    if (review) await prisma.testimonial.update({ where: { id: review.id }, data: { published: true, featured: false } });
    for (const url of created.uploads) {
      const file = path.join(process.cwd(), "public", url);
      if (existsSync(file)) await rm(file);
    }
    console.log(`  removed ${removed.count} test leads, restored settings, project, review and uploads`);
    await prisma.$disconnect();
  }

  console.log("\n---- page errors ----");
  console.log(pageErrors.length ? pageErrors.join("\n") : "(none)");
  console.log(`\nPASS ${passed.length}   FAIL ${failed.length}`);
  if (failed.length) {
    console.log("\nFailed:\n  " + failed.join("\n  "));
    process.exit(1);
  }
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
