import Image from "next/image";
import Link from "next/link";
import { Stars } from "@/components/site/Stars";
import { IMG_Q } from "@/lib/images";
import type { PairedTestimonial } from "@/lib/testimonial-projects";

/**
 * A review set beside the house it is about (§2.7) — "testimonial pages
 * can be made more interesting with pictures".
 *
 * The quote keeps the weight: it is set at display size in the studio's
 * serif, and the photograph is support, not decoration. Attribution runs
 * underneath in muted grey with the name, the project and where it is,
 * and the project name links through — a review is the best possible
 * introduction to the page it describes.
 *
 * `flip` alternates which side the photograph falls on so a run of these
 * reads as a rhythm rather than a template.
 */
export function TestimonialFeature({
  item,
  flip = false,
}: {
  item: PairedTestimonial;
  flip?: boolean;
}) {
  const { project } = item;

  return (
    <figure className="grid items-center gap-8 md:grid-cols-12 md:gap-gutter">
      {project && (
        <Link
          href={`/projects/${project.slug}`}
          className={`group block ${
            flip ? "md:col-span-5 md:order-2 md:col-start-8" : "md:col-span-5"
          }`}
        >
          <div className="rounded-frame relative aspect-[4/3] overflow-hidden bg-stone/10">
            <Image
              src={project.image}
              alt={`${project.title} — the home this review is about`}
              fill
              sizes="(min-width: 768px) 42vw, 100vw"
              quality={IMG_Q.feature}
              placeholder={project.blur ? "blur" : "empty"}
              blurDataURL={project.blur ?? undefined}
              className="rounded-[inherit] object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            />
          </div>
        </Link>
      )}

      <div
        className={
          flip ? "md:col-span-6 md:order-1 md:col-start-1" : "md:col-span-6 md:col-start-7"
        }
      >
        <Stars rating={item.rating} size={15} />
        <blockquote className="font-display text-h3 mt-6 leading-snug">
          &ldquo;{item.excerpt ?? item.text}&rdquo;
        </blockquote>
        <figcaption className="mt-8 text-stone">
          <p className="text-sm font-medium text-ink">{item.author}</p>
          <p className="mono-label mt-1.5">
            {[
              project?.title,
              project?.location ?? item.context,
              item.source === "google" ? "via Google" : null,
            ]
              .filter(Boolean)
              .join(" — ")}
          </p>
        </figcaption>
      </div>
    </figure>
  );
}
