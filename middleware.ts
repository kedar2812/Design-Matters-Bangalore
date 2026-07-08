import { NextResponse, type NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// STUDIO_DISABLED=1 (set per deployment, e.g. client-preview hosting)
// makes the studio and its login plain-404 — to a visitor the dashboard
// doesn't exist. Unset, middleware is the usual edge JWT check for
// /studio (full session logic in lib/auth.ts); /login passes through.
const studioOff = (req: NextRequest) =>
  NextResponse.rewrite(new URL("/studio-disabled-404", req.url));

export default process.env.STUDIO_DISABLED === "1"
  ? studioOff
  : NextAuth(authConfig).auth;

export const config = {
  matcher: ["/studio/:path*", "/login"],
};
