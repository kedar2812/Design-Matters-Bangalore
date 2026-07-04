import { PostForm } from "@/components/studio/PostForm";

export const metadata = { title: "Studio — New journal entry" };

export default function NewPostPage() {
  return (
    <div>
      <header className="mb-10">
        <p className="mono-label mb-2">Journal — new entry</p>
        <h1 className="font-display text-h2">Write.</h1>
      </header>
      <PostForm />
    </div>
  );
}
