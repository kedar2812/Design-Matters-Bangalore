import Link from "next/link";

export default function NotFound() {
  return (
    <main className="blueprint-grid flex min-h-dvh flex-col items-start justify-center px-gutter">
      <p className="mono-label mb-4">404 — Drawing not found</p>
      <h1 className="font-display text-hero max-w-4xl">
        This page never made it past concept.
      </h1>
      <Link
        href="/"
        className="mono-label rule mt-12 pt-4 underline underline-offset-4 transition-colors hover:text-brass"
      >
        Back to the studio
      </Link>
    </main>
  );
}
