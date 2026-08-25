import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { getIdentity } from "@/lib/settings";
import { LoginForm } from "@/components/studio/LoginForm";

export const metadata: Metadata = {
  title: "Studio access",
  robots: { index: false },
};

/**
 * Studio sign-in.
 *
 * Deliberately plain — one card, two fields, nothing to read. It carries
 * `data-studio` so it is the dashboard's palette rather than the public
 * site's: this screen is the first thing the studio sees, and it should
 * be continuous with what is behind it rather than with the portfolio.
 *
 * The only decoration is a soft bronze wash behind the card, which costs
 * no images, no JavaScript and no layout.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const identity = await getIdentity();

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
    <main
      data-studio
      className="studio-root relative grid min-h-dvh place-items-center overflow-hidden px-6 py-12"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 size-[34rem] rounded-full bg-s-accent/[0.10] blur-[110px]" />
        <div className="absolute -bottom-48 -right-32 size-[30rem] rounded-full bg-s-accent/[0.07] blur-[110px]" />
      </div>

      <div className="relative w-full max-w-[24rem]">
        <Link href="/" className="group mb-7 flex items-center justify-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-s-sm bg-s-solid text-[0.75rem] font-semibold tracking-wide text-s-on-solid transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-rotate-6">
            DM
          </span>
          <span className="leading-tight">
            <span className="block text-[0.875rem] font-semibold tracking-[-0.01em] text-s-text">
              {identity.shortName}
            </span>
            <span className="block text-[0.6875rem] text-s-text-3">Studio</span>
          </span>
        </Link>

        <div className="rounded-s border border-s-border bg-s-surface p-6 shadow-s-md sm:p-7">
          <h1 className="text-[1.125rem] font-semibold tracking-[-0.02em] text-s-text">
            Welcome back
          </h1>
          <p className="mt-1 text-[0.8125rem] text-s-text-2">Sign in to manage the website.</p>

          <div className="mt-6">
            <LoginForm action={login} error={Boolean(error)} />
          </div>
        </div>

        <p className="mt-6 text-center text-[0.75rem] text-s-text-3">
          Private, for the {identity.shortName} team
        </p>
      </div>
    </main>
  );
}
