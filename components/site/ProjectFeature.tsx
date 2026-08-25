import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { LightboxTrigger } from "@/components/site/Lightbox";
import { IMG_Q } from "@/lib/images";
import type { ProjectFeature as Feature } from "@/lib/project-features";

/**
 * A named piece of work that belongs to the project it sits inside —
 * Club Nadora within Woodsvale, for instance.
 *
 * Reads as a chapter of the same page rather than a second project: the
 * same rule-and-eyebrow heading the rest of the site uses, the same
 * title-block metadata grid as the parent, and the images open in the
 * parent's lightbox. It is set on the bone background with no card, no
 * border and no tint, so it reads as a shift in subject, not a widget.
 *
 * `lightboxOffset` is where this section's images begin in the page's
 * media array — the parent page owns that array, so it does the counting.
 */
export function ProjectFeature({
  feature,
  lightboxOffset,
}: {
  feature: Feature;
  lightboxOffset: number;
}) {
  const facts = feature.facts.filter(([, v]) => v !== null && v !== "");

  return (
    <section className="px-gutter pb-section" aria-labelledby="feature-heading">
      <Reveal>
        <div className="rule pt-4">
          <p className="mono-label mb-4">{feature.eyebrow}</p>
          <h2 id="feature-heading" className="font-display text-h2">
            {feature.title}
          </h2>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-x-gutter gap-y-10 md:grid-cols-12">
        {facts.length > 0 && (
          <Reveal className="md:col-span-4">
            <dl className="space-y-5">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="mono-label mb-1">{label}</dt>
                  <dd className="text-sm text-ink-soft">{value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        )}
        <Reveal delay={0.1} className="md:col-span-7 md:col-start-6">
          <div className="space-y-6 leading-relaxed text-ink-soft">
            {feature.body.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Uneven pair: the wider frame leads, the narrower one sits below
          the fold of the first on desktop, the same asymmetry the
          project gallery uses, at a smaller scale. */}
      <div className="mt-14 grid gap-gutter md:grid-cols-12">
        {feature.images.map((img, i) => (
          <Reveal
            key={img.url}
            delay={i * 0.1}
            className={i === 0 ? "md:col-span-7" : "md:col-span-5 md:mt-16"}
          >
            <LightboxTrigger index={lightboxOffset + i}>
              <div
                className={`rounded-frame relative overflow-hidden bg-stone/15 ${
                  i === 0 ? "aspect-[4/3]" : "aspect-[3/4]"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  sizes={
                    i === 0
                      ? "(min-width: 768px) 58vw, 100vw"
                      : "(min-width: 768px) 42vw, 100vw"
                  }
                  quality={IMG_Q.feature}
                  className="rounded-[inherit] object-cover"
                />
              </div>
            </LightboxTrigger>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
