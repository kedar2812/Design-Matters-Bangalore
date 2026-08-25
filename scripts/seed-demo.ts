/**
 * Demo data for the studio dashboard — realistic-looking traffic and
 * enquiries so every KPI, chart and pipeline stage reads as it will
 * with real data.
 *
 *   npx tsx scripts/seed-demo.ts          seed (re-runnable; replaces old demo rows)
 *   npx tsx scripts/seed-demo.ts --clear  remove every demo row, touch nothing real
 *
 * Every row is created with an id starting with "demo-", so cleanup is
 * exact: real enquiries and real page views are never touched.
 */
import "dotenv/config";
import { prisma } from "../lib/db";

const DAY = 86_400_000;

// Deterministic RNG — reseeding gives the same believable dataset.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260708);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

async function clear() {
  const [pv, leads] = await Promise.all([
    prisma.pageView.deleteMany({ where: { id: { startsWith: "demo-" } } }),
    prisma.lead.deleteMany({ where: { id: { startsWith: "demo-" } } }),
  ]);
  console.log(`Cleared ${pv.count} demo page views, ${leads.count} demo enquiries.`);
}

async function seed() {
  await clear(); // re-runnable

  const projects = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: { slug: true },
  });
  const slugs = projects.map((p) => p.slug);
  if (slugs.length === 0) console.warn("No published projects, project-page views will be skipped.");

  /* ---------------------------------------------------------- page views */
  // 60 days, gentle upward trend, weekend dips, mobile-heavy (IG traffic).
  const now = Date.now();
  const sources = [null, null, null, null, "instagram", "instagram", "instagram", "google", "google", "referral"] as const;
  const referrers: Record<string, string | null> = {
    instagram: "https://l.instagram.com/",
    google: "https://www.google.com/",
    referral: "https://www.buildofy.com/",
  };

  const pageViews: {
    id: string;
    path: string;
    source: string | null;
    referrer: string | null;
    device: string;
    country: string;
    createdAt: Date;
  }[] = [];

  let n = 0;
  for (let ago = 59; ago >= 0; ago--) {
    const date = new Date(now - ago * DAY);
    const weekend = [0, 6].includes(date.getDay());
    const trend = 1 + ((59 - ago) / 59) * 0.9; // slow growth over the window
    const base = weekend ? 14 : 22;
    const count = Math.round(base * trend + rand() * 14);

    for (let i = 0; i < count; i++) {
      const r = rand();
      const path =
        r < 0.26 || slugs.length === 0
          ? "/"
          : r < 0.42
            ? "/projects"
            : r < 0.78
              ? // top-heavy interest: earlier (featured) projects get more views
                `/projects/${slugs[Math.min(slugs.length - 1, Math.floor(rand() * rand() * slugs.length))]}`
              : r < 0.86
                ? "/about"
                : r < 0.94
                  ? "/services"
                  : "/contact";
      const source = pick(sources);
      // Spread through the day, evenings heaviest.
      const at = new Date(date);
      at.setHours(8 + Math.floor(rand() * 15), Math.floor(rand() * 60), Math.floor(rand() * 60), 0);
      pageViews.push({
        id: `demo-pv-${(n++).toString().padStart(5, "0")}`,
        path,
        source,
        referrer: source ? (referrers[source] ?? null) : null,
        device: rand() < 0.62 ? "mobile" : "desktop",
        country: rand() < 0.93 ? "IN" : pick(["AE", "US", "SG", "GB"] as const),
        createdAt: at,
      });
    }
  }

  /* ------------------------------------------------------------ enquiries */
  // Context chips match each message — the chips are the first thing the
  // studio reads, so demo rows must not contradict themselves.
  type Stage = "NEW" | "CONTACTED" | "DISCUSSION" | "WON" | "LOST";
  // [name, message, daysAgo, status, topic, budget, location, source]
  const people: [string, string, number, Stage, string, string, string, string][] = [
    ["Ananya Deshpande", "We just bought a 40x60 corner plot and want a home that stays cool without air-conditioning. Your Vivek Residence convinced us.", 1, "NEW", "New home", "₹1 – 2 crore", "Jayanagar, Bangalore", "vivek-residence"],
    ["Rohit Malhotra", "Looking for an architect for our duplex, we love courtyards and natural light. Could we set up a call this week?", 2, "NEW", "New home", "Above ₹2 crore", "Sarjapur Road, Bangalore", "home"],
    ["Sneha Prabhu", "Full interiors for our 3BHK in Whitefield, warm wood, brass, nothing glossy. Your portfolio feels exactly right.", 3, "CONTACTED", "Interiors", "₹50 lakh – 1 crore", "Whitefield, Bangalore", "contact-page"],
    ["Shruti & Karan Iyer", "We saw your work on Buildofy. Planning a 4BHK on a sloping site in Hennur, would like to discuss feasibility.", 4, "CONTACTED", "New home", "₹1 – 2 crore", "Hennur, Bangalore", "house-of-levels"],
    ["Harish Chandra", "Building a home for my parents on our plot in Sahakar Nagar. Ground plus one, garden in front, nothing showy.", 5, "CONTACTED", "New home", "₹50 lakh – 1 crore", "Sahakar Nagar, Bangalore", "contact-page"],
    ["Mohammed Faisal", "Interiors for a new 3BHK apartment, possession in October. Keen on a warm, minimal look like your dental clinic project.", 6, "CONTACTED", "Interiors", "Under ₹50 lakh", "HSR Layout, Bangalore", "contact-page"],
    ["Divya Menon", "We own an old bungalow near Cunningham Road and want advice on whether to restore or rebuild.", 7, "DISCUSSION", "Consultation", "Not sure yet", "Cunningham Road, Bangalore", "home"],
    ["Priya Venkatesh", "We run a boutique café chain and want to redo our flagship outlet. Timeline is about five months.", 9, "DISCUSSION", "Commercial", "Under ₹50 lakh", "Indiranagar, Bangalore", "contact-page"],
    ["Arjun Nair", "Weekend home near Kanakapura, something earthy, exposed brick, big verandahs. Budget is flexible for the right design.", 13, "DISCUSSION", "New home", "Above ₹2 crore", "Kanakapura Road, Bangalore", "home"],
    ["Deepa Krishnamurthy", "Renovating my parents' 30-year-old house in Jayanagar while keeping its soul intact. Is this something you take on?", 17, "DISCUSSION", "Consultation", "₹50 lakh – 1 crore", "Jayanagar, Bangalore", "wellington-street-residence"],
    ["Vikram Shetty", "Office interiors for our 6,000 sq ft software studio in HSR. Want it to not look like a typical IT office.", 22, "CONTACTED", "Commercial", "₹1 – 2 crore", "HSR Layout, Bangalore", "contact-page"],
    ["Nisha Agarwal", "Compact home on a 20x30 site, want to prove small can be beautiful. Loved the House of Levels.", 27, "WON", "New home", "Under ₹50 lakh", "Yelahanka, Bangalore", "house-of-levels"],
    ["Suresh Reddy", "Farmhouse and guest annexe on two acres near Hosur. Looking for someone who designs with the land.", 33, "DISCUSSION", "New home", "Above ₹2 crore", "Hosur", "home"],
    ["Kavitha Rao", "Interiors consultation for our villa, mainly living spaces and pooja room. Would like a premium but restrained palette.", 38, "WON", "Interiors", "₹50 lakh – 1 crore", "Whitefield, Bangalore", "contact-page"],
    ["Imran Khan", "Boutique hotel concept, 14 keys, near Mysore. Early stage, need help with massing and approvals.", 45, "LOST", "Commercial", "Above ₹2 crore", "Mysore", "contact-page"],
    ["Lakshmi Narayan", "New independent house for a joint family, six bedrooms across two floors, vastu-compliant layout preferred.", 51, "WON", "New home", "₹1 – 2 crore", "Kanakapura Road, Bangalore", "home"],
    ["Tara Bhandari", "Second opinion on a half-finished residential project, our previous architect moved abroad.", 58, "LOST", "Consultation", "Not sure yet", "Yelahanka, Bangalore", "contact-page"],
    ["Gautam Pillai", "We want a house that ages well, brick, stone, minimal paint. Saw your epsilon project and it stuck with us.", 66, "WON", "New home", "₹1 – 2 crore", "Hennur, Bangalore", "contact-page"],
    ["Rachna Gupta", "Clinic interiors, 1,800 sq ft, calm and non-clinical. You did something similar for a dental studio?", 74, "LOST", "Commercial", "Under ₹50 lakh", "Sarjapur Road, Bangalore", "contact-page"],
    ["Aditya Kulkarni", "Row house makeover in Yelahanka, open kitchen, skylights, a reading loft for the kids.", 81, "CONTACTED", "Interiors", "Under ₹50 lakh", "Yelahanka, Bangalore", "contact-page"],
    ["Meera & Sanjay Hegde", "Retirement home on our ancestral plot, single storey, garden-first, wheelchair-friendly throughout.", 88, "WON", "New home", "₹50 lakh – 1 crore", "Sarjapur Road, Bangalore", "wellington-street-residence"],
  ];

  const validSources = new Set(["contact-page", "home", ...slugs]);
  const leads = people.map(([name, message, daysAgo, status, topic, budget, location, source], i) => {
    const first = name.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "");
    const at = new Date(now - daysAgo * DAY);
    at.setHours(9 + Math.floor(rand() * 11), Math.floor(rand() * 60), 0, 0);
    return {
      id: `demo-lead-${(i + 1).toString().padStart(3, "0")}`,
      name,
      email: `${first}${Math.floor(10 + rand() * 89)}@gmail.com`,
      phone: `+91 9${Math.floor(100000000 + rand() * 899999999)}`,
      message,
      source: validSources.has(source) ? source : "contact-page",
      topic,
      budget,
      location,
      status,
      createdAt: at,
    };
  });

  await prisma.pageView.createMany({ data: pageViews });
  await prisma.lead.createMany({ data: leads });
  console.log(`Seeded ${pageViews.length} page views and ${leads.length} enquiries (all ids prefixed "demo-").`);
  console.log(`Remove any time with: npm run demo:clear`);
}

const wantClear = process.argv.includes("--clear");
(wantClear ? clear() : seed())
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
