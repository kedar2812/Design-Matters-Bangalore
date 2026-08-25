import { ProjectForm } from "@/components/studio/ProjectForm";

export const metadata = { title: "Studio | New project" };

export default function NewProjectPage() {
  return (
    <div>
      <header className="mb-10">
        <p className="s-label mb-2">Projects · new</p>
        <h1 className="text-[1.375rem] font-semibold tracking-[-0.02em]">Add a project.</h1>
      </header>
      <ProjectForm />
    </div>
  );
}
