import type { Metadata } from "next";
import { MaskedHeading } from "@/components/motion/MaskedHeading";
import { Reveal } from "@/components/motion/Reveal";
import { Entry } from "@/components/motion/Entry";
import { EnquirySection } from "@/components/site/EnquirySection";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About — The Studio & Ar. Kiran Hanumaiah",
  description:
    "Design Matters is a Bengaluru architecture and interior design studio founded in 2011 by Ar. Kiran Hanumaiah. Meet the team and the thinking behind the work.",
  alternates: { canonical: "/about" },
};

const team = [
  "Ar. Harshitha",
  "Ar. Keerthana",
  "Ar. Pallavi VK",
  "Ar. Maitri Shah",
  "Ar. Jerin Sabu",
  "Ar. Reshma",
  "Ar. Mrudula",
  "Ar. Shefreen",
];

const approach = [
  {
    n: "01",
    title: "Listen before drawing",
    body: "A brief is more than a room count. We start with how you live and work — the routines, the rituals, the things you didn't know to ask for — and let the plan grow from there.",
  },
  {
    n: "02",
    title: "Design for this climate",
    body: "Bengaluru rewards buildings that breathe. Orientation, shading, cross-ventilation and honest materials do the heavy lifting long before any machine has to.",
  },
  {
    n: "03",
    title: "Detail is the design",
    body: "The junction of two materials, the depth of a reveal, where the light lands at four in the afternoon — the small decisions are the ones you live with daily, so we sweat them.",
  },
  {
    n: "04",
    title: "Stay through the build",
    body: "Drawings don't build houses; follow-through does. We stay involved from the first site visit to handover, so what gets built is what was designed.",
  },
];

export default function AboutPage() {
  return (
    <main className="pb-section pt-36">
      {/* Story */}
      <section className="px-gutter">
        <p className="mono-label mb-4">The studio — est. {site.founded}</p>
        <MaskedHeading className="font-display text-h1 max-w-4xl">
          Good design isn&rsquo;t added on. It&rsquo;s the point.
        </MaskedHeading>

        <div className="mt-16 grid gap-10 md:grid-cols-12">
          <Entry className="md:col-span-6 md:col-start-4">
            <div className="space-y-6 leading-relaxed text-ink-soft">
              <p>
                Design Matters is an architecture and interior design studio in
                Indiranagar, Bengaluru. Since 2011 we have designed private
                residences, apartment interiors, workplaces and hospitality
                spaces across the city — work that ranges in scale but not in
                attention.
              </p>
              <p>
                The name is the position. In a city building faster than it can
                think, we hold that the difference between a building and a
                place worth inhabiting is design — considered early, argued
                over properly, and carried through to the last drawer detail.
              </p>
              <p>
                That conviction has quietly built one of the strongest client
                records among Bengaluru firms — most of our work still arrives
                by referral, and the studio has been recognised with Best of
                Houzz service awards three years running.
              </p>
            </div>
          </Entry>
        </div>
      </section>

      {/* Philosophy — DMA confirmed they'll supply this statement
          (website-discovery form); swap the quote for their words. */}
      <section className="mt-section px-gutter">
        <Reveal>
          <div className="rule pt-8">
            <p className="mono-label mb-8">The philosophy</p>
            <blockquote className="font-display text-h1 max-w-5xl">
              &ldquo;Design isn&rsquo;t what we add to a building. It&rsquo;s
              everything we refuse to leave out — light, air, proportion, and
              the way a home holds the people in it.&rdquo;
            </blockquote>
            <p className="mono-label mt-8 text-brass">
              — {site.principal}, Principal Architect
            </p>
          </div>
        </Reveal>
      </section>

      {/* Principal */}
      <section className="blueprint-grid mt-section px-gutter py-20">
        <Reveal>
          <p className="mono-label mb-4">Principal architect</p>
          <h2 className="font-display text-h2 mb-8">{site.principal}</h2>
          <div className="grid gap-10 md:grid-cols-12">
            <div className="space-y-6 leading-relaxed text-ink-soft md:col-span-6">
              <p>
                Kiran holds a Bachelor&rsquo;s in Architecture from B.M.S.
                College of Engineering, Bengaluru, and a Master&rsquo;s from the
                School of Planning and Architecture, New Delhi. Across more
                than two decades in architecture, interior and product design,
                he has built a practice defined by range — and by the patience
                to get the small things right.
              </p>
              <p>
                Before founding Design Matters in 2011, he spent twelve years
                as senior associate architect at Team-2 Architects and
                Engineers, running projects of widely varying scale and
                complexity — an apprenticeship in the unglamorous disciplines
                that make buildings actually happen: coordination, costing,
                and site.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Team */}
      <section className="mt-section px-gutter">
        <Reveal>
          <div className="rule mb-10 flex items-baseline justify-between pt-4">
            <h2 className="font-display text-h2">The team</h2>
            <p className="mono-label">{team.length} architects</p>
          </div>
          <ul className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
            {team.map((name, i) => (
              <li key={name}>
                <p className="mono-label mb-1">{String(i + 1).padStart(2, "0")}</p>
                <p className="text-sm text-ink-soft">{name}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* Approach */}
      <section className="mt-section px-gutter">
        <Reveal>
          <div className="rule mb-12 pt-4">
            <h2 className="font-display text-h2">How we work</h2>
          </div>
        </Reveal>
        <div className="grid gap-x-gutter gap-y-14 md:grid-cols-2">
          {approach.map((item, i) => (
            <Reveal key={item.n} delay={(i % 2) * 0.12}>
              <p className="mono-label mb-3">{item.n}</p>
              <h3 className="font-display text-h3 mb-4">{item.title}</h3>
              <p className="max-w-md leading-relaxed text-ink-soft">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="pt-section">
        <EnquirySection
          source="about"
          eyebrow="Work with the studio"
          title="Tell us about your project."
        />
      </div>
    </main>
  );
}
