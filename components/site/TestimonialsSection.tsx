import Link from "next/link";
import { getPublishedTestimonials } from "@/lib/content";
import { getSection } from "@/lib/settings";
import { Reveal } from "@/components/motion/Reveal";
import { Stars } from "@/components/site/Stars";

/**
 * The home page's client-voices strip: one testimonial given real
 * editorial weight, two in support, and the Google rating underneath.
 * Which reviews appear here is curated from the dashboard — the
 * `featured` toggle on Studio → Testimonials.
 */
export async function TestimonialsSection() {
  const [testimonials, copy] = await Promise.all([
    getPublishedTestimonials(),
    getSection("testimonials"),
  ]);

  const featured = testimonials.filter((t) => t.featured);
  if (featured.length === 0) return null;

  const [lead, ...rest] = featured;
  const side = rest.slice(0, 2);

  return (
    <section className="px-gutter pb-section" aria-labelledby="testimonials-heading">
      <Reveal>
        <div className="rule mb-12 flex items-baseline justify-between pt-4">
          <h2 id="testimonials-heading" className="font-display text-h2">
            {copy.homeHeading}
          </h2>
          <Link
            href="/testimonials"
            className="mono-label transition-colors hover:text-brass"
          >
            {copy.homeLinkLabel} &rarr;
          </Link>
        </div>
      </Reveal>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-gutter">
        {/* The lead voice — set like the site's pull-quotes. */}
        <Reveal className="lg:col-span-7">
          <figure>
            <Stars rating={lead.rating} size={15} />
            <blockquote className="font-display text-h3 mt-6 max-w-2xl leading-snug">
              &ldquo;{lead.excerpt ?? lead.text}&rdquo;
            </blockquote>
            <figcaption className="mt-8">
              <p className="text-sm font-medium text-ink">{lead.author}</p>
              <p className="mono-label mt-1 text-stone/80">
                {[lead.context, lead.source === "google" ? "via Google" : null]
                  .filter(Boolean)
                  .join(" — ")}
              </p>
            </figcaption>
          </figure>
        </Reveal>

        {/* Two supporting voices + the rating that backs them. */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          {side.map((t, i) => (
            <Reveal key={t.id} delay={0.1 + i * 0.1}>
              <figure className="rounded-2xl border border-hairline bg-paper p-6">
                <Stars rating={t.rating} />
                <blockquote className="mt-4">
                  <p className="line-clamp-4 text-sm leading-relaxed text-ink-soft">
                    {t.excerpt ?? t.text}
                  </p>
                </blockquote>
                <figcaption className="mt-4 flex items-baseline justify-between gap-4">
                  <p className="truncate text-sm font-medium text-ink">{t.author}</p>
                  {t.sourceDate && (
                    <span className="mono-label shrink-0 text-stone/70">
                      {t.sourceDate}
                    </span>
                  )}
                </figcaption>
              </figure>
            </Reveal>
          ))}

          <Reveal delay={0.3}>
            <a
              href={copy.googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mono-label flex items-baseline gap-2 px-1 transition-colors hover:text-brass"
            >
              <span className="text-brass">&#9733; {copy.ratingValue}</span>
              <span>
                — {copy.reviewCount} Google reviews{" "}
                <span
                  aria-hidden
                  className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
