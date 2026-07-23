import type { Metadata } from "next";
import { MaskedHeading } from "@/components/motion/MaskedHeading";
import { Reveal } from "@/components/motion/Reveal";
import { EnquirySection } from "@/components/site/EnquirySection";
import { getSection } from "@/lib/settings";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Services — Architecture, Interior Design & Consultation",
  description:
    "Architecture for residences, apartments, commercial and hospitality projects; end-to-end interior design; and design consultation — from Design Matters, Bengaluru.",
  alternates: { canonical: "/services" },
};

const n = (i: number) => String(i + 1).padStart(2, "0");

export default async function ServicesPage() {
  const content = await getSection("services");

  return (
    <main className="pb-section pt-36">
      <section className="px-gutter">
        <p className="mono-label mb-4">{content.eyebrow}</p>
        <MaskedHeading className="font-display text-h1 max-w-4xl">
          {content.heading}
        </MaskedHeading>

        <div className="mt-20 space-y-20">
          {content.services.map((s, i) => (
            <Reveal key={s.title}>
              <div className="rule grid gap-6 pt-8 md:grid-cols-12">
                <p className="mono-label md:col-span-2">{n(i)}</p>
                <h2 className="font-display text-h2 md:col-span-4">{s.title}</h2>
                <div className="md:col-span-5 md:col-start-8">
                  <p className="leading-relaxed text-ink-soft">{s.body}</p>
                  {s.scope && <p className="mono-label mt-5">{s.scope}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="blueprint-grid mt-section px-gutter py-20">
        <Reveal>
          <p className="mono-label mb-4">{content.processEyebrow}</p>
          <h2 className="font-display text-h2 mb-14">{content.processHeading}</h2>
        </Reveal>
        <ol className="grid gap-x-gutter gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {content.process.map((step, i) => (
            <Reveal key={step.title} delay={(i % 3) * 0.1}>
              <li>
                <p className="mono-label mb-3">{n(i)}</p>
                <h3 className="font-display text-h3 mb-3">{step.title}</h3>
                <p className="max-w-sm text-sm leading-relaxed text-ink-soft">{step.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <div className="pt-section">
        <EnquirySection
          source="services"
          eyebrow="Ready when you are"
          title="Tell us what you're planning."
        />
      </div>
    </main>
  );
}
