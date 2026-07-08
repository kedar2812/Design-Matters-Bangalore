import { NextResponse, type NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// The studio and its login plain-404 — to a visitor the dashboard
// doesn't exist — when STUDIO_DISABLED=1 or when the deployment has no
// database (snapshot mode: the studio couldn't run anyway). Otherwise
// middleware is the usual edge JWT check for /studio (full session
// logic in lib/auth.ts); /login passes through.
const studioOff = (req: NextRequest) =>
  NextResponse.rewrite(new URL("/studio-disabled-404", req.url));

export default process.env.STUDIO_DISABLED === "1" || !process.env.DATABASE_URL
  ? studioOff
  : NextAuth(authConfig).auth;

export const config = {
  matcher: ["/studio/:path*", "/login"],
};
