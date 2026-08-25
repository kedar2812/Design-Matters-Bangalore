import type { Metadata } from "next";
import Link from "next/link";

// A 404 answers with the right status code, so it will not be indexed —
// but it is still a page a person can land on from a stale link or an old
// Wix URL, and an untitled tab reading "localhost" is a dead end. The
// noindex is belt-and-braces for the case where a host mis-serves it 200.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="blueprint-grid flex min-h-dvh flex-col items-start justify-center px-gutter">
      <p className="mono-label mb-4">404 · Drawing not found</p>
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
