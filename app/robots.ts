import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/studio/",
        "/login",
        "/api/",
        // Where `middleware.ts` rewrites the studio when the deployment
        // has no database. It renders the 404 page, but the rewrite keeps
        // the path, and a crawler that reaches it would otherwise index a
        // not-found page under a real-looking URL.
        "/studio-disabled-404",
        // /journal is deliberately NOT listed. The client opted out of a
        // public blog and those pages carry `robots: noindex`, which is
        // the stronger instruction — but only if a crawler is allowed to
        // fetch the page and read it. Blocking the path here would hide
        // the noindex, and a URL that is merely blocked can still be
        // indexed on the strength of an external link. Unlinked plus
        // noindex plus out of the sitemap is already the right answer.
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
