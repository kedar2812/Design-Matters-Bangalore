import { cn } from "@/lib/utils";

/**
 * A row of five rating stars in the drafting language — thin strokes,
 * brass fills. Server-safe; used on the testimonials page, the home
 * strip and the studio dashboard.
 */
export function Stars({
  rating,
  className,
  size = 14,
}: {
  rating: number;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-[3px]", className)}
      role="img"
      aria-label={`Rated ${rating} out of 5`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          aria-hidden
          className={i < rating ? "text-brass" : "text-hairline"}
        >
          <path
            d="M10 2.5l2.23 4.8 5.27.6-3.9 3.58 1.05 5.2L10 14.06l-4.65 2.62 1.05-5.2-3.9-3.58 5.27-.6z"
            fill={i < rating ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}
