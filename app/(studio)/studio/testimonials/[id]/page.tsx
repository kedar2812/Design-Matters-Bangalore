import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  TestimonialForm,
  type TestimonialFormData,
} from "@/components/studio/TestimonialForm";

export const metadata = { title: "Studio — Edit testimonial" };

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await prisma.testimonial.findUnique({ where: { id } });
  if (!t) notFound();

  const initial: TestimonialFormData = {
    id: t.id,
    author: t.author,
    context: t.context ?? "",
    rating: t.rating,
    text: t.text,
    excerpt: t.excerpt ?? "",
    sourceDate: t.sourceDate ?? "",
    source: t.source,
    featured: t.featured,
    published: t.published,
  };

  return (
    <div>
      <header className="mb-10">
        <p className="s-label mb-2">
          Testimonials — {t.published ? "on site" : "hidden"}
          {t.source === "google" ? " — from Google" : ""}
        </p>
        <h1 className="text-[1.375rem] font-semibold tracking-[-0.02em]">{t.author}</h1>
      </header>
      <TestimonialForm initial={initial} />
    </div>
  );
}
