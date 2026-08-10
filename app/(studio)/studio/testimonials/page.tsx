import Link from "next/link";
import { prisma } from "@/lib/db";
import { SyncReviewsButton } from "@/components/studio/SyncReviewsButton";
import { TestimonialList, type TestimonialRow } from "@/components/studio/TestimonialList";
import { Card, CardHead, PageHead, buttonClass } from "@/components/studio/ui";
import { Reveal } from "@/components/studio/Reveal";
import { ExternalIcon, PlusIcon } from "@/components/studio/icons";
import { getSection } from "@/lib/settings";

export const metadata = { title: "Studio — Testimonials" };

export default async function StudioTestimonials() {
  const [testimonials, copy] = await Promise.all([
    prisma.testimonial.findMany({ orderBy: { order: "asc" } }),
    getSection("testimonials"),
  ]);

  const live = testimonials.filter((t) => t.published).length;
  const featured = testimonials.filter((t) => t.published && t.featured).length;

  const rows: TestimonialRow[] = testimonials.map((t) => ({
    id: t.id,
    author: t.author,
    context: t.context,
    rating: t.rating,
    text: t.text,
    source: t.source,
    sourceDate: t.sourceDate,
    featured: t.featured,
    published: t.published,
  }));

  return (
    <div>
      <PageHead
        title="Testimonials"
        subtitle="What clients have said, and which of it appears on the site."
        action={
          <Link href="/studio/testimonials/new" className={buttonClass("primary", "md")}>
            <PlusIcon className="size-4" />
            Add a testimonial
          </Link>
        }
      />

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Reveal delay={0} className="h-full">
          <Card className="flex h-full flex-col justify-between p-4">
            <p className="text-[0.8125rem] font-medium text-s-text-3">Google rating</p>
            <div>
              <p className="s-display mt-1.5 text-[2rem] leading-none text-s-text">
                {copy.ratingValue}
                <span className="text-[1rem] text-s-text-3"> / 5</span>
              </p>
              <p className="mt-1 text-[0.75rem] text-s-text-3">
                across {copy.reviewCount} reviews
              </p>
            </div>
            <a
              href={copy.googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-[0.75rem] text-s-text-2 transition-colors hover:text-s-accent"
            >
              <ExternalIcon className="size-3.5" />
              Open the listing
            </a>
          </Card>
        </Reveal>

        <Reveal delay={0.05} className="h-full">
          <Card className="flex h-full flex-col justify-between p-4">
            <p className="text-[0.8125rem] font-medium text-s-text-3">On the site</p>
            <div>
              <p className="s-display mt-1.5 text-[2rem] leading-none text-s-text">
                {live}
                <span className="text-[1rem] text-s-text-3"> / {testimonials.length}</span>
              </p>
              <p className="mt-1 text-[0.75rem] text-s-text-3">
                {featured} on the home page
              </p>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.1} className="h-full">
          <Card className="flex h-full flex-col justify-between gap-3 p-4">
            <div>
              <p className="text-[0.8125rem] font-medium text-s-text-3">Google sync</p>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-s-text-2">
                Pulls the rating and any new reviews. New ones arrive hidden, so nothing
                appears on the site until you have read it.
              </p>
            </div>
            <SyncReviewsButton />
          </Card>
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <Card className="overflow-hidden">
          <CardHead
            title="All testimonials"
            hint={`${testimonials.length} total · ${live} on the site`}
            divided
          />
          <div className="p-3">
            <TestimonialList testimonials={rows} />
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
