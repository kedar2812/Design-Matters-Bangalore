import type { Metadata } from "next";
import Link from "next/link";
import { MaskedHeading } from "@/components/motion/MaskedHeading";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Services — Architecture, Interior Design & Consultation",
  description:
    "Architecture for residences, apartments, commercial and hospitality projects; end-to-end interior design; and design consultation — from Design Matters, Bengaluru.",
  alternates: { canonical: "/services" },
};

const services = [
  {
    n: "01",
    title: "Architecture",
    body: "New builds and major renovations: private residences, apartment buildings, commercial and hospitality projects. From feasibility and massing to municipal approvals and construction drawings — the full arc, one studio accountable for all of it.",
    scope: "Residences · Apartments · Commercial · Hospitality",
  },
  {
    n: "02",
    title: "Interior design",
    body: "Complete interiors for homes and workplaces — space planning, custom furniture, lighting, materials and finishes, executed with vendors we've worked with for years. Design intent survives all the way to the final coat.",
    scope: "Homes · Apartments · Offices · Clinics",
  },
  {
    n: "03",
    title: "Consultation",
    body: "Focused engagements when you need an architect's judgement more than a full commission: plot evaluation before you buy, design review of ongoing work, or a masterplan-level look at what a property could become.",
    scope: "Site evaluation · Design review · Feasibility",
  },
];

const process = [
  { n: "01", title: "Brief", body: "We meet, walk the site, and listen. You leave with questions worth asking; we leave with the real brief." },
  { n: "02", title: "Concept", body: "Plans, massing, mood — the big moves. We iterate together until the direction feels inevitable." },
  { n: "03", title: "Design development", body: "The concept becomes a buildable proposition: materials, structure, services, budgets aligned." },
  { n: "04", title: "Documentation", body: "Approval and construction drawings, specifications, and a tender-ready package." },
  { n: "05", title: "Build", body: "Site visits, contractor coordination, and the thousand mid-course decisions — made quickly, made once." },
  { n: "06", title: "Handover", body: "Snag lists closed, systems commissioned, and a building that matches its drawings." },
];

export default function ServicesPage() {
  return (
    <main className="pb-section pt-36">
      <section className="px-gutter">
        <p className="mono-label mb-4">What we do</p>
        <MaskedHeading className="font-display text-h1 max-w-4xl">
          Three ways of working, one standard of care.
        </MaskedHeading>

        <div className="mt-20 space-y-20">
          {services.map((s) => (
            <Reveal key={s.n}>
              <div className="rule grid gap-6 pt-8 md:grid-cols-12">
                <p className="mono-label md:col-span-2">{s.n}</p>
                <h2 className="font-display text-h2 md:col-span-4">{s.title}</h2>
                <div className="md:col-span-5 md:col-start-8">
                  <p className="leading-relaxed text-ink-soft">{s.body}</p>
                  <p className="mono-label mt-5">{s.scope}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="blueprint-grid mt-section px-gutter py-20">
        <Reveal>
          <p className="mono-label mb-4">Brief to handover</p>
          <h2 className="font-display text-h2 mb-14">The process</h2>
        </Reveal>
        <ol className="grid gap-x-gutter gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {process.map((step, i) => (
            <Reveal key={step.n} delay={(i % 3) * 0.1}>
              <li>
                <p className="mono-label mb-3">{step.n}</p>
                <h3 className="font-display text-h3 mb-3">{step.title}</h3>
                <p className="max-w-sm text-sm leading-relaxed text-ink-soft">{step.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="px-gutter pt-section">
        <Reveal>
          <p className="mono-label mb-4">Ready when you are</p>
          <Link
            href="/contact"
            className="font-display text-h1 inline-block transition-colors hover:text-brass"
          >
            Tell us about your site&thinsp;&rarr;
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
