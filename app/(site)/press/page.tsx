import type { Metadata } from "next";
import { MaskedHeading } from "@/components/motion/MaskedHeading";
import { Entry } from "@/components/motion/Entry";
import { EnquirySection } from "@/components/site/EnquirySection";
import { PressList } from "@/components/site/PressList";
import { FEATURED_ONLINE, FEATURED_PRINT, publications } from "@/lib/press";
import { jsonLdScript, pressJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Press — Design Matters in publication",
  description:
    "Projects and writing by Design Matters Architects featured on Buildofy, The Architects Diary and in the Deccan Herald.",
  alternates: { canonical: "/press" },
};

export default function PressPage() {
  const names = publications();

  return (
    <main className="pb-section pt-36">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          pressJsonLd([...FEATURED_ONLINE, ...FEATURED_PRINT]),
        )}
      />

      <section className="px-gutter pb-section">
        <p className="mono-label mb-4">Press</p>
        <MaskedHeading className="font-display text-h1 max-w-4xl">
          Where the work has been written about.
        </MaskedHeading>
        <Entry delay={0.1}>
          <p className="mt-10 max-w-2xl leading-relaxed text-ink-soft">
            {names.join(", ")} — {FEATURED_ONLINE.length + FEATURED_PRINT.length}{" "}
            features covering the studio&rsquo;s houses, its approach to daylight
            and ventilation, and the small decisions that make a compact plot
            feel generous.
          </p>
        </Entry>
      </section>

      <PressList />

      <EnquirySection
        source="press"
        eyebrow="Work with the studio"
        title="Tell us about your project."
      />
    </main>
  );
}
