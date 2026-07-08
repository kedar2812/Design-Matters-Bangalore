/**
 * Export the public site's content to `content/site-snapshot.json`, the
 * file `lib/content.ts` serves when no DATABASE_URL is configured
 * (database-free deploys, e.g. the Vercel client preview).
 *
 *   npm run snapshot
 *
 * Only PUBLISHED projects/posts are exported — drafts never leave the
 * studio. Commit the refreshed file after content changes.
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../lib/db";

async function main() {
  const [projects, posts] = await Promise.all([
    prisma.project.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      include: {
        gallery: { orderBy: { order: "asc" } },
        storyBlocks: { orderBy: { order: "asc" } },
      },
    }),
    prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  const out = join(process.cwd(), "content", "site-snapshot.json");
  writeFileSync(
    out,
    JSON.stringify({ exportedAt: new Date().toISOString(), projects, posts }, null, 1),
  );
  console.log(
    `Snapshot: ${projects.length} projects, ${posts.length} posts → content/site-snapshot.json`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
