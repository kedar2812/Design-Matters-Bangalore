/**
 * End-to-end check of every write path in the dashboard.
 *
 * Drives a real browser against a production build, then reads the
 * database directly to confirm what the click actually did. A screenshot
 * only proves a screen rendered; this proves the button saved.
 *
 * It cleans up after itself — the project it creates is deleted, and the
 * lead it edits is put back — so it is safe to run against the studio's
 * own data. It is still pointed at localhost by default.
 *
 * Run: OUT=<dir> EMAIL=… PASSWORD=… npx tsx scripts/e2e-studio.ts
 */
import puppeteer, { type Page } from "puppeteer-core";
import "dotenv/config";
import { prisma } from "../lib/db";

const BASE = process.env.BASE ?? "http://localhost:3111";
const CHROME =
  process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = process.env.OUT ?? ".";

const passed: string[] = [];
const failed: string[] = [];
const ok = (m: string) => {
  passed.push(m);
  console.log("  PASS  " + m);
};
const bad = (m: string) => {
  failed.push(m);
  console.log("  FAIL  " + m);
};
const check = (cond: unknown, m: string) => (cond ? ok(m) : bad(m));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function goto(page: Page, path: string) {
  await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForNetworkIdle({ idleTime: 500, timeout: 15000 }).catch(() => {});
  await wait(500);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  const pageErrors: string[] = [];
  page.on("pageerror", (e: unknown) => pageErrors.push(String((e as Error)?.message ?? e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("favicon")) {
      pageErrors.push(m.text().slice(0, 200));
    }
  });
  await page.setViewport({ width: 1500, height: 950 });

  /* ------------------------------------------------------------- auth */
  await goto(page, "/studio/dashboard");
  check(page.url().includes("/login"), "unauthenticated /studio redirects to /login");

  await page.type('input[name="email"]', process.env.EMAIL!);
  await page.type('input[name="password"]', process.env.PASSWORD!);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await wait(2500);
  check(page.url().includes("/studio/dashboard"), "login lands on the dashboard");

  /* --------------------------------------------------- create project */
  const title = "E2E Test House " + Date.now();
  await goto(page, "/studio/projects/new");
  await page.type('input[placeholder="e.g. Wellington Street Residence"]', title);
  const clickedSave = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) =>
      x.textContent?.includes("Save as draft"),
    );
    b?.click();
    return Boolean(b);
  });
  check(clickedSave, "the save-as-draft control exists");
  await wait(3500);
  const created = await prisma.project.findFirst({ where: { title } });
  check(created, "project written to the database");
  check(created?.status === "DRAFT", "saved as a draft");

  /* --------------------------------------------------------- publish */
  if (created) {
    await goto(page, "/studio/projects");
    const clicked = await page.evaluate((t) => {
      // Walk up from the element whose own text is exactly the title
      // until we reach the container that also holds the row's buttons.
      const span = [...document.querySelectorAll("span")].find(
        (x) => x.textContent?.trim() === t,
      );
      let row: HTMLElement | null = span?.parentElement ?? null;
      while (row && !row.querySelector("button[title]")) row = row.parentElement;
      const own = row?.querySelector<HTMLButtonElement>('button[title="Publish to the site"]');
      own?.click();
      return Boolean(own);
    }, title);
    await wait(2500);
    const after = await prisma.project.findUnique({ where: { id: created.id } });
    check(clicked && after?.status === "PUBLISHED", "publish toggle flips DRAFT to PUBLISHED");
    check(
      await page.evaluate(() => document.body.innerText.includes("is live")),
      "a toast confirms the publish",
    );
  }

  /* --------------------------------------------------------- reorder */
  const before = await prisma.project.findMany({
    orderBy: { order: "asc" },
    select: { id: true, title: true, order: true },
  });
  await goto(page, "/studio/projects");

  // A real pointer drag on the first row's grip, dropped three rows down.
  const grips = await page.$$('button[aria-label^="Reorder "]');
  check(grips.length === before.length, "every project row has a drag handle");
  if (grips.length > 3) {
    const from = await grips[0].boundingBox();
    const to = await grips[3].boundingBox();
    if (from && to) {
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
      await page.mouse.down();
      // Several small steps — framer-motion needs movement to register a
      // drag rather than a click.
      for (let i = 1; i <= 8; i++) {
        await page.mouse.move(
          from.x + from.width / 2,
          from.y + from.height / 2 + ((to.y - from.y) * i) / 8,
        );
        await wait(45);
      }
      await page.mouse.up();
      await wait(3000);
    }
  }

  const after = await prisma.project.findMany({
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });
  check(after.every((p, i) => p.order === i), "order values are contiguous 0..n-1 after a drag");
  check(
    new Set(after.map((p) => p.order)).size === after.length,
    "no duplicate order values after a drag",
  );
  check(after[0].id !== before[0].id, "the drag actually changed the order");

  // Put the studio's own order back exactly as it was.
  await prisma.$transaction(
    before.map((p, order) => prisma.project.update({ where: { id: p.id }, data: { order } })),
  );
  const restored = await prisma.project.findMany({
    orderBy: { order: "asc" },
    select: { id: true },
  });
  check(
    restored.every((p, i) => p.id === before[i].id),
    "original project order restored after the test",
  );

  /* ------------------------------------------------------- lead flow */
  const lead = await prisma.lead.findFirst({ orderBy: { createdAt: "desc" } });
  if (lead) {
    await goto(page, "/studio/leads");
    check(
      await page.evaluate((e) => document.body.innerText.includes(e), lead.email),
      "lead email is visible in the table without opening anything",
    );

    const original = lead.status;
    const next = original === "CONTACTED" ? "DISCUSSION" : "CONTACTED";
    await page.evaluate(
      (args) => {
        const s = [...document.querySelectorAll<HTMLSelectElement>("select")].find((x) =>
          x.getAttribute("aria-label")?.includes(args.name),
        );
        if (!s) return;
        s.value = args.next;
        s.dispatchEvent(new Event("change", { bubbles: true }));
      },
      { name: lead.name, next },
    );
    await wait(2500);
    const moved = await prisma.lead.findUnique({ where: { id: lead.id } });
    check(moved?.status === next, "lead stage change persists");
    await prisma.lead.update({ where: { id: lead.id }, data: { status: original } });

    await goto(page, "/studio/leads?open=" + lead.id);
    await wait(1200);
    check(
      await page.evaluate(() => Boolean(document.querySelector('[role="dialog"]'))),
      "?open=<id> opens the detail panel",
    );

    const note = "e2e-note-" + Date.now();
    const hasTextarea = await page.evaluate(() =>
      Boolean(document.querySelector('[role="dialog"] textarea')),
    );
    if (hasTextarea) {
      await page.click('[role="dialog"] textarea');
      await page.type('[role="dialog"] textarea', note, { delay: 12 });
      const typedValue = await page.$eval(
        '[role="dialog"] textarea',
        (el) => (el as HTMLTextAreaElement).value,
      );
      check(typedValue.includes(note), "the note reaches the textarea");
      await wait(3500);
      const withNote = await prisma.lead.findUnique({ where: { id: lead.id } });
      check(withNote?.notes?.includes(note), "notes autosave with no save button");
      await prisma.lead.update({ where: { id: lead.id }, data: { notes: lead.notes } });
    } else {
      bad("notes textarea present in the panel");
    }
  }

  /* -------------------------------------------------- delete project */
  if (created) {
    await goto(page, "/studio/projects");
    const foundDelete = await page.evaluate((t) => {
      const btn = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Delete ' + t + '"]',
      );
      btn?.click();
      return Boolean(btn);
    }, title);
    check(foundDelete, "the row exposes a delete control");
    await wait(900);
    check(
      await page.evaluate(() => Boolean(document.querySelector('[role="alertdialog"]'))),
      "delete opens the custom confirm dialog, not window.confirm",
    );

    await page.evaluate(() => {
      const b = [...document.querySelectorAll('[role="alertdialog"] button')].find((x) =>
        x.textContent?.includes("Delete project"),
      ) as HTMLButtonElement | undefined;
      b?.click();
    });
    await wait(3000);
    check(
      !(await prisma.project.findUnique({ where: { id: created.id } })),
      "project deleted from the database",
    );
  }

  /* ------------------------------------------------- screens render */
  const SCREENS: [string, string][] = [
    ["/studio/analytics", "Daily views"],
    ["/studio/analytics?range=7", "Last 7 days"],
    ["/studio/testimonials", "All testimonials"],
    ["/studio/content", "Website content"],
    ["/studio/content/identity", "View page"],
    ["/studio/leads?stage=WON", "Enquiries"],
    ["/studio/projects", "All projects"],
  ];
  for (const [path, needle] of SCREENS) {
    await goto(page, path);
    const text = await page.evaluate(() => document.body.innerText);
    check(text.includes(needle), path + " renders");
  }

  /* ------------------------------------------------------ mobile shell */
  await page.setViewport({ width: 390, height: 800 });
  await goto(page, "/studio/dashboard");
  const opened = await page.evaluate(() => {
    const b = document.querySelector<HTMLButtonElement>('button[aria-label="Open menu"]');
    b?.click();
    return Boolean(b);
  });
  await wait(700);
  check(
    opened &&
      (await page.evaluate(() =>
        Boolean(document.querySelector('[role="dialog"][aria-label="Studio menu"]')),
      )),
    "mobile menu opens a drawer",
  );
  await page.setViewport({ width: 1500, height: 950 });
  await page.screenshot({ path: OUT + "/e2e-final.png" });
  await browser.close();

  console.log("\n---- page errors ----");
  console.log(pageErrors.length ? [...new Set(pageErrors)].join("\n") : "(none)");
  console.log("\nPASS " + passed.length + "   FAIL " + failed.length);
  if (failed.length) console.log("FAILED:\n" + failed.map((f) => " - " + f).join("\n"));

  await prisma.$disconnect();
  process.exit(failed.length ? 1 : 0);
}

main();
