import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { StudioNav } from "@/components/studio/StudioNav";

export const metadata = {
  robots: { index: false, follow: false },
};

// Second line of defence behind middleware — verifies the session
// server-side before rendering any studio screen.
export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    // [&_img]: the site-wide rounded-photography rule is tuned for large
    // frames; dashboard thumbnails are small, so soften it here.
    <div className="min-h-dvh bg-bone lg:grid lg:grid-cols-[13rem_1fr] [&_img]:rounded-md">
      {/* Rail */}
      <aside className="border-b border-hairline px-6 py-5 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-b-0 lg:border-r lg:py-8">
        <Link href="/studio/dashboard" className="mb-5 block lg:mb-12">
          <span className="font-display text-lg tracking-tight">Design Matters</span>
          <span className="mono-label mt-0.5 block">Studio</span>
        </Link>

        <StudioNav />

        <div className="mt-5 flex items-center gap-6 lg:mt-auto lg:flex-col lg:items-start lg:gap-3">
          <Link
            href="/"
            className="mono-label transition-colors hover:text-ink"
          >
            View site &rarr;
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="mono-label transition-colors hover:text-brass"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="px-6 py-10 lg:px-12">{children}</main>
    </div>
  );
}
