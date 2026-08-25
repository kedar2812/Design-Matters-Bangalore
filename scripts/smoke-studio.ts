/**
 * Read-only check of a deployed dashboard.
 *
 * The counterpart to e2e-studio.ts, which refuses to run anywhere but
 * localhost because it writes. This one only logs in, visits every
 * screen and asserts on what rendered — safe to point at the live site.
 *
 * Run: BASE=https://… EMAIL=… PASSWORD=… OUT=<dir> npx tsx scripts/smoke-studio.ts
 */
import puppeteer, { type Page } from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE ?? "http://localhost:3111";
const CHROME =
  process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = process.env.OUT ?? ".";

const passed: string[] = [];
const failed: string[] = [];
const check = (cond: unknown, m: string) => {
  if (cond) {
    passed.push(m);
    console.log("  PASS  " + m);
  } else {
    failed.push(m);
    console.log("  FAIL  " + m);
  }
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function goto(page: Page, path: string) {
  await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForNetworkIdle({ idleTime: 700, timeout: 25000 }).catch(() => {});
  await wait(700);
}

const SCREENS: [string, string, string][] = [
  ["/studio/dashboard", "Overview", "01-overview"],
  ["/studio/projects", "All projects", "02-projects"],
  ["/studio/leads", "Enquiries", "03-leads"],
  ["/studio/analytics", "Views over time", "04-analytics"],
  ["/studio/testimonials", "All testimonials", "05-testimonials"],
  ["/studio/content", "Website content", "06-content"],
  ["/studio/content/identity", "View page", "07-identity"],
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e: unknown) => errors.push(page.url() + " :: " + String((e as Error)?.message ?? e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("favicon")) errors.push(page.url() + " :: " + m.text().slice(0, 300));
  });
  await page.setViewport({ width: 1600, height: 1000 });

  await goto(page, "/studio/dashboard");
  check(page.url().includes("/login"), "unauthenticated /studio redirects to /login");

  await page.type('input[name="email"]', process.env.EMAIL!);
  await page.type('input[name="password"]', process.env.PASSWORD!);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 90000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await wait(3000);
  check(page.url().includes("/studio"), "login succeeds");

  for (const [path, needle, name] of SCREENS) {
    await goto(page, path);
    const text = await page.evaluate(() => document.body.innerText);
    check(text.includes(needle), path + " renders");
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  }

  // The enquiries table must show contact details without opening a row —
  // the whole point of the rebuild. A deployment with no enquiries yet
  // should show the empty state instead, and that is not a failure.
  await goto(page, "/studio/leads");
  const leads = await page.evaluate(() => ({
    rows: document.querySelectorAll("tbody tr").length,
    hasEmail: /@/.test(document.querySelector("table")?.textContent ?? ""),
    emptyState: document.body.innerText.includes("No enquiries"),
  }));
  if (leads.rows > 0) {
    check(leads.hasEmail, "enquiries table shows email addresses inline");
  } else {
    check(leads.emptyState, "no enquiries yet, empty state shown instead of a bare table");
  }

  await goto(page, "/studio/projects");
  check(
    await page.evaluate(
      () => document.querySelectorAll('button[aria-label^="Reorder "]').length > 0,
    ),
    "project rows expose drag handles",
  );

  // The notification centre must at least mount and open — the bell is
  // the only piece of chrome here that renders nothing when it has
  // nothing to say, so "absent" and "broken" look identical otherwise.
  await goto(page, "/studio/dashboard");
  check(
    await page.evaluate(`Boolean(document.querySelector('button[aria-haspopup="dialog"]'))`),
    "topbar has a notifications bell",
  );
  await page.evaluate(
    `(document.querySelector('button[aria-haspopup="dialog"]') || {click(){}}).click()`,
  );
  await wait(700);
  check(
    await page.evaluate(
      `Boolean(document.querySelector('[role="dialog"][aria-label="Updates"]'))`,
    ),
    "notifications panel opens",
  );
  await page.screenshot({ path: `${OUT}/08-notifications.png` });

  for (const r of ["7", "365", "all"]) {
    await goto(page, "/studio/analytics?range=" + r);
    check(
      await page.evaluate(`document.body.innerText.includes("Views over time")`),
      "analytics range=" + r + " renders",
    );
  }

  // Dashboard tokens resolved — a missing stylesheet shows up as a
  // transparent card rather than a broken page, so assert on the paint.
  await goto(page, "/studio/dashboard");
  check(
    await page.evaluate(() => {
      const el = document.querySelector("[data-studio]");
      if (!el) return false;
      const v = getComputedStyle(el).getPropertyValue("--s-surface").trim();
      return v.length > 0;
    }),
    "studio tokens resolve (stylesheet shipped)",
  );

  await browser.close();
  console.log("\n---- page errors ----");
  console.log(errors.length ? [...new Set(errors)].join("\n") : "(none)");
  console.log("\nPASS " + passed.length + "   FAIL " + failed.length);
  if (failed.length) console.log("FAILED:\n" + failed.map((f) => " - " + f).join("\n"));
  process.exit(failed.length ? 1 : 0);
}

main();
