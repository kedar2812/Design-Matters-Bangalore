import { Reveal } from "@/components/motion/Reveal";
import { MaskedHeading } from "@/components/motion/MaskedHeading";
import { cn } from "@/lib/utils";

/**
 * Section header in the style the client asked us to follow on the About
 * page (digitalbluefoam.com/company/team).
 *
 * The signature there is small: a short drawn rule, then a monospaced
 * uppercase label, then a large heading well below it. The rule is what
 * makes it read as a drawing sheet rather than a web page, and it costs
 * one span.
 *
 * DMA already had `mono-label` doing the second half of that job, so this
 * only adds the rule and fixes the spacing relationship, and it uses the
 * studio's own bone/brass palette rather than the reference's cold greys.
 * Copying the layout is the brief; copying the colours would just make
 * this someone else's website.
 */
export function SectionHead({
  eyebrow,
  heading,
  intro,
  as = "h2",
  className,
  tone = "ink",
}: {
  eyebrow: string;
  heading: string;
  intro?: string;
  as?: "h1" | "h2";
  className?: string;
  /** `cream` for the dark bands, so the rule and label stay visible. */
  tone?: "ink" | "cream";
}) {
  const dark = tone === "cream";
  return (
    <div className={cn("max-w-4xl", className)}>
      <Reveal>
        <p className="mono-label mb-8 flex items-center gap-4">
          <span
            aria-hidden
            className={cn("block h-px w-10 shrink-0", dark ? "bg-brass-bright" : "bg-brass")}
          />
          <span className={dark ? "text-cream/70" : "text-stone"}>{eyebrow}</span>
        </p>
      </Reveal>
      <MaskedHeading as={as} className="font-display text-h1">
        {heading}
      </MaskedHeading>
      {intro && (
        <Reveal>
          <p
            className={cn(
              "mt-8 max-w-2xl text-lg leading-relaxed",
              dark ? "text-cream/80" : "text-ink-soft",
            )}
          >
            {intro}
          </p>
        </Reveal>
      )}
    </div>
  );
}
