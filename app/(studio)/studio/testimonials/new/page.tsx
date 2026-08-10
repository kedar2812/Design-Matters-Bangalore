import { TestimonialForm } from "@/components/studio/TestimonialForm";

export const metadata = { title: "Studio — New testimonial" };

export default function NewTestimonialPage() {
  return (
    <div>
      <header className="mb-10">
        <p className="s-label mb-2">Testimonials — new</p>
        <h1 className="text-[1.375rem] font-semibold tracking-[-0.02em]">Add a testimonial.</h1>
      </header>
      <TestimonialForm />
    </div>
  );
}
