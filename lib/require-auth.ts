import { auth } from "@/lib/auth";

/**
 * Guard for mutating server actions. Middleware already protects
 * /studio pages; this protects the actions themselves.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}
