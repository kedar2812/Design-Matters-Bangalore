import type { Metadata } from "next";
import { EnquirySection } from "@/components/site/EnquirySection";
import { PageHero } from "@/components/site/PageHero";
import { PressList } from "@/components/site/PressList";
import { FEATURED_ONLINE, FEATURED_PRINT, publications } from "@/lib/press";
import { getHeroImages } from "@/lib/portfolio";
import { jsonLdScript, pressJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Press & Features",
  description:
    "Houses by Design Matters Architects, Bangalore, featured on Buildofy, The Architects Diary and in the Deccan Herald.",
  alternates: { canonical: "/press" },
};

export default async function PressPage() {
  const names = publications();
  // The houses these pieces are actually about, in the order they were
  // published — not a decorative selection.
  const images = await getHeroImages(
    FEATURED_ONLINE.map((f) => f.projectSlug).filter((s): s is string => Boolean(s)),
  );

  return (
    <main className="pb-section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          pressJsonLd([...FEATURED_ONLINE, ...FEATURED_PRINT]),
        )}
      />

      <PageHero
        eyebrow="Press"
        heading="Where the work has been written about."
        intro={`${names.join(", ")}. ${FEATURED_ONLINE.length + FEATURED_PRINT.length} features covering the studio's houses, its approach to daylight and ventilation, and the small decisions that make a compact plot feel generous.`}
        images={images}
      />

      <div className="pt-section" />

      <PressList />

      <EnquirySection
        source="press"
        eyebrow="Work with the studio"
        title="Tell us about your project."
      />
    </main>
  );
}
