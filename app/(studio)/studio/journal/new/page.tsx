import { PostForm } from "@/components/studio/PostForm";

export const metadata = { title: "Studio | New journal entry" };

export default function NewPostPage() {
  return (
    <div>
      <header className="mb-10">
        <p className="s-label mb-2">Journal · new entry</p>
        <h1 className="text-[1.375rem] font-semibold tracking-[-0.02em]">Write.</h1>
      </header>
      <PostForm />
    </div>
  );
}
