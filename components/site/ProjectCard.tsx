import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
  className?: string;
};

/**
 * Portfolio tile — hover: image eases up in scale, metadata slides in
 * over a quiet ink gradient. Pure CSS (transform/opacity), no JS.
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
  className,
}: ProjectCardProps) {
  const meta = [location, year].filter(Boolean).join(", ");

  return (
    <Link
      href={`/projects/${slug}`}
      className={cn("rounded-frame group relative block overflow-hidden bg-stone/20", aspect, className)}
    >
      {heroImage && (
        <Image
          src={heroImage}
          alt={title}
          fill
          sizes={sizes}
          priority={priority}
          placeholder={heroBlur ? "blur" : "empty"}
          blurDataURL={heroBlur ?? undefined}
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
        />
      )}

      {/* Frosted category chip — ties the card grid to the hero's glass language */}
      <span className="glass-dark mono-label absolute left-4 top-4 rounded-full px-3.5 py-1.5 text-bone/90">
        {category}
      </span>

      {/* Ink gradient + metadata, slides up on hover; always visible on touch via focus styles */}
      <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-ink/70 to-transparent p-5 pt-14 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
        <p className="font-display text-h3 text-paper">{title}</p>
        <p className="mono-label mt-1 text-bone/80">
          {category}
          {meta && ` — ${meta}`}
        </p>
      </div>
    </Link>
  );
}
