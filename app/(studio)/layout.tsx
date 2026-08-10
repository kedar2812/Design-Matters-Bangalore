import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StudioNav, StudioTitle } from "@/components/studio/StudioNav";
import { StudioTransition } from "@/components/studio/StudioTransition";
import { NavProgressProvider } from "@/components/studio/NavProgress";
import { FeedbackProvider } from "@/components/studio/Feedback";
import { Notifications } from "@/components/studio/Notifications";
import { getNotices } from "@/lib/notices";

export const metadata = {
  robots: { index: false, follow: false },
};

/**
 * The dashboard shell.
 *
 * `data-studio` scopes every token in app/studio.css; `studio-root` is
 * what paints the ground. They are separate so that the toasts and
 * dialogs, which portal into document.body and are therefore outside this
 * subtree, can re-declare the tokens without also painting a full-screen
 * background over the app.
 */
export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Second line of defence behind middleware — verifies the session
  // server-side before rendering any studio screen.
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [newLeads, notices] = await Promise.all([
    prisma.lead.count({ where: { status: "NEW" } }),
    getNotices(),
  ]);

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div data-studio className="studio-root min-h-dvh lg:flex">
      <NavProgressProvider>
        <FeedbackProvider>
          <StudioNav
            newLeads={newLeads}
            email={session.user.email ?? "Studio"}
            logout={
              <form action={logout}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-s-sm px-2.5 py-[7px] text-left text-[0.8125rem] text-s-text-2 transition-colors hover:bg-s-surface-3 hover:text-s-text"
                >
                  <span className="grid size-[17px] shrink-0 place-items-center">
                    <span className="block size-1.5 rounded-full bg-s-text-3" />
                  </span>
                  Sign out
                </button>
              </form>
            }
          />

          <div className="flex min-w-0 flex-1 flex-col">
            {/* The topbar carries the route's name so the screens below
                don't each have to open with a headline. It is sticky and
                translucent: on a long table the studio always knows where
                it is, and content passing under it reads as depth rather
                than as a seam. */}
            <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-s-border bg-s-surface/85 px-4 backdrop-blur-md lg:px-7">
              <StudioTitle />
              <div className="ml-auto flex items-center gap-1">
                <Notifications notices={notices} />
              </div>
            </header>

            <main className="min-w-0 px-4 pb-8 pt-6 lg:px-7">
              <div className="mx-auto w-full max-w-[1360px]">
                <StudioTransition>{children}</StudioTransition>
              </div>
            </main>
          </div>
        </FeedbackProvider>
      </NavProgressProvider>
    </div>
  );
}
