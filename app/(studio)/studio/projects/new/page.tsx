import { ProjectForm } from "@/components/studio/ProjectForm";

export const metadata = { title: "Studio — New project" };

export default function NewProjectPage() {
  return (
    <div>
      <header className="mb-10">
        <p className="mono-label mb-2">Projects — new</p>
        <h1 className="font-display text-h2">Add a project.</h1>
      </header>
      <ProjectForm />
    </div>
  );
}
