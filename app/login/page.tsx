import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Studio access",
  robots: { index: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/studio/dashboard",
      });
    } catch (e) {
      if (e instanceof AuthError) redirect("/login?error=1");
      throw e; // NEXT_REDIRECT must propagate
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bone px-gutter">
      <div className="w-full max-w-sm">
        <p className="mono-label mb-3">Design Matters — Studio</p>
        <h1 className="font-display text-h2 mb-10">Sign in</h1>

        <form action={login} className="space-y-6">
          <div>
            <label htmlFor="email" className="mono-label mb-2 block">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full border-b border-hairline bg-transparent py-2 text-ink outline-none transition-colors focus:border-brass"
            />
          </div>
          <div>
            <label htmlFor="password" className="mono-label mb-2 block">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full border-b border-hairline bg-transparent py-2 text-ink outline-none transition-colors focus:border-brass"
            />
          </div>

          {error && (
            <p className="text-sm text-brass-deep" role="alert">
              That email and password don&rsquo;t match our records.
            </p>
          )}

          <button
            type="submit"
            className="mt-4 w-full border border-ink bg-ink py-3 text-sm tracking-wide text-bone transition-colors hover:bg-transparent hover:text-ink"
          >
            Enter studio
          </button>
        </form>

        <p className="rule mono-label mt-12 pt-4">
          Private — for the Design Matters team
        </p>
      </div>
    </main>
  );
}
