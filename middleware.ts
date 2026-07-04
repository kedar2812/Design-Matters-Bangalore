import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Edge middleware: JWT check only, no DB. Full session logic in lib/auth.ts.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/studio/:path*"],
};
