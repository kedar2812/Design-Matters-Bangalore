import type { Metadata } from "next";
import { getPublishedTestimonials, type Testimonial } from "@/lib/content";
import { getSection } from "@/lib/settings";
import { jsonLdScript, pageOpenGraph, SITE_URL } from "@/lib/seo";
import { MaskedHeading } from "@/components/motion/MaskedHeading";
import { Entry } from "@/components/motion/Entry";
import { Reveal } from "@/components/motion/Reveal";
import { TextScrub } from "@/components/motion/TextScrub";
import { Stars } from "@/components/site/Stars";
import { TestimonialCard } from "@/components/site/TestimonialCard";
import { TestimonialFeature } from "@/components/site/TestimonialFeature";
import { EnquirySection } from "@/components/site/EnquirySection";
import { pairTestimonials } from "@/lib/testimonial-projects";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Client Reviews & Testimonials",
  description:
    "Google reviews from Design Matters clients across Bangalore: residences, villas and interiors, in the owners' own words.",
  alternates: { canonical: "/testimonials" },
  openGraph: pageOpenGraph({ path: "/testimonials" }),
};

/** AggregateRating + a sample of reviews, attached to the studio's
 *  Organization node so search engines read them as one entity. */
function reviewsJsonLd(
  rating: string,
  count: string,
  reviews: Testimonial[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#organization`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: rating,
      reviewCount: count,
      bestRating: "5",
    },
    review: reviews.slice(0, 8).map((t) => ({
      "@type": "Review",
      author: { "@type": "Person", name: t.author },
      reviewRating: { "@type": "Rating", ratingValue: String(t.rating), bestRating: "5" },
      reviewBody: t.excerpt ?? t.text,
    })),
  };
}

export default async function TestimonialsPage() {
  const [testimonials, copy] = await Promise.all([
    getPublishedTestimonials(),
    getSection("testimonials"),
  ]);

  // Reviews we can pair with a photograph of the reviewer's own home get
  // the editorial treatment above the archive; the rest read as quotes.
  const paired = await pairTestimonials(testimonials);
  const illustrated = paired.filter((t) => t.project);

  return (
    <main className="pb-section pt-36">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          reviewsJsonLd(copy.ratingValue, copy.reviewCount, testimonials),
        )}
      />

      {/* ------------------------------------------------------ opening */}
      <section className="px-gutter">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="mono-label mb-4">{copy.eyebrow}</p>
            <MaskedHeading className="font-display text-h1 max-w-3xl">
              {copy.heading}
            </MaskedHeading>
            <Entry>
              <p className="mt-8 max-w-xl leading-relaxed text-ink-soft">
                {copy.intro}
              </p>
            </Entry>
          </div>

          {/* The Google rating, given the weight it has earned. */}
          <Entry className="lg:col-span-4">
            <a
              href={copy.googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl border border-hairline bg-paper p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-brass hover:shadow-lg hover:shadow-noir/5"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-display text-h1 leading-none">
                  {copy.ratingValue}
                </span>
                <Stars rating={5} size={16} className="translate-y-[-0.35rem]" />
              </div>
              <p className="mono-label mt-4">
                {copy.reviewCount} reviews on Google
              </p>
              <p className="mono-label mt-1.5 text-brass">
                Read them on Google{" "}
                <span
                  aria-hidden
                  className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </p>
            </a>
          </Entry>
        </div>
      </section>

      {/* ------------------------------------ reviews, beside their homes */}
      {illustrated.length > 0 && (
        <section
          className="mt-section px-gutter"
          aria-label="Reviews and the projects they describe"
        >
          <div className="space-y-24">
            {illustrated.map((t, i) => (
              <Reveal key={t.id}>
                <TestimonialFeature item={t} flip={i % 2 === 1} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* --------------------------------------------------- pull-quote */}
      <section className="mt-section px-gutter">
        <div className="rule pt-8">
          <TextScrub as="blockquote" className="font-display text-h1 max-w-5xl">
            &ldquo;{copy.pullQuote}&rdquo;
          </TextScrub>
          <Reveal>
            <p className="mono-label mt-8 text-brass">
              {copy.pullQuoteAuthor}, on Google
            </p>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------------- the archive */}
      <section className="mt-section px-gutter" aria-label="All testimonials">
        <Reveal>
          <div className="rule mb-12 flex flex-wrap items-baseline justify-between gap-4 pt-4">
            <p className="mono-label">
              {testimonials.length} reviews, reproduced as written
            </p>
            <a
              href={copy.googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mono-label transition-colors hover:text-brass"
            >
              Worked with us? Leave a review &rarr;
            </a>
          </div>
        </Reveal>

        <div className="columns-1 gap-6 sm:columns-2 xl:columns-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.id} delay={(i % 3) * 0.08} className="mb-6">
              <TestimonialCard
                author={t.author}
                context={t.context}
                rating={t.rating}
                text={t.text}
                sourceDate={t.sourceDate}
                source={t.source}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ enquire */}
      <div className="pt-section">
        <EnquirySection
          source="testimonials"
          eyebrow="Join them"
          title="Tell us about your project."
        />
      </div>
    </main>
  );
}
