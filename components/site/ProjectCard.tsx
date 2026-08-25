import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { IMG_Q } from "@/lib/images";

type ProjectCardProps = {
  slug: string;
  title: string;
  category: string;
  year?: number | null;
  location?: string | null;
  heroImage?: string | null;
  heroBlur?: string | null;
  /** e.g. "aspect-[4/3]" | "aspect-[3/4]" */
  aspect?: string;
  sizes?: string;
  priority?: boolean;
  /** Sequence number printed beside the title. */
  index?: number;
  className?: string;
};

/**
 * Portfolio tile. The caption sits *below* the frame in the printed
 * register rather than hiding behind a hover overlay — the studio's
 * index should be readable at a glance, including on touch, where
 * hover never happens. Hover then adds the motion: the photograph eases
 * up in scale inside its frame and a brass rule draws under the caption.
 * Transform/opacity only, no JS.
 */
export function ProjectCard({
  slug,
  title,
  category,
  year,
  location,
  heroImage,
  heroBlur,
  aspect = "aspect-[4/3]",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  index,
  className,
}: ProjectCardProps) {
  const meta = [location, year].filter(Boolean).join(", ");

  return (
    <Link href={`/projects/${slug}`} className={cn("group block", className)}>
      <div className={cn("rounded-frame relative overflow-hidden bg-stone/15", aspect)}>
        {heroImage && (
          <Image
            src={heroImage}
            alt={title}
            fill
            sizes={sizes}
            quality={IMG_Q.card}
            priority={priority}
            placeholder={heroBlur ? "blur" : "empty"}
            blurDataURL={heroBlur ?? undefined}
            className="rounded-[inherit] object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
          />
        )}

        {/* Frosted category chip, ties the index to the hero's glass language */}
        <span className="glass-dark mono-label absolute left-4 top-4 rounded-full px-3.5 py-1.5 text-cream/90">
          {category}
        </span>

        {/* Barely-there wash that deepens on hover, so the chip keeps
            contrast over pale photographs. */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-[inherit] bg-gradient-to-b from-noir/20 to-transparent opacity-60 transition-opacity duration-700 group-hover:opacity-100"
        />
      </div>

      {/* Caption */}
      <div className="pt-5">
        <div className="flex items-baseline gap-3">
          {index !== undefined && (
            <span className="mono-label shrink-0 text-brass">
              {String(index).padStart(2, "0")}
            </span>
          )}
          <h3 className="font-display text-h3 leading-tight transition-colors duration-500 group-hover:text-brass">
            {title}
          </h3>
        </div>
        {meta && <p className="mono-label mt-1.5">{meta}</p>}
        <span
          aria-hidden
          className="mt-4 block h-px w-full origin-left scale-x-0 bg-brass transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
        />
      </div>
    </Link>
  );
}
