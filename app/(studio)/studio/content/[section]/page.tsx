import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClass } from "@/components/studio/ui";
import { prisma } from "@/lib/db";
import { SECTIONS } from "@/lib/content-schema";
import { getSection, SECTION_KEYS, type SectionKey } from "@/lib/settings";
import { ContentForm } from "@/components/studio/ContentForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const meta = SECTIONS.find((s) => s.key === section);
  return { title: meta ? `Studio | ${meta.title}` : "Studio" };
}

export default async function ContentSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!SECTION_KEYS.includes(section as SectionKey)) notFound();
  const key = section as SectionKey;

  const meta = SECTIONS.find((s) => s.key === key);
  if (!meta) notFound();

  const [values, stored] = await Promise.all([
    getSection(key),
    prisma.siteSetting.findUnique({ where: { key }, select: { key: true } }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/studio/content"
          className="inline-flex items-center gap-1.5 text-[0.8125rem] text-s-text-3 transition-colors hover:text-s-accent"
        >
          &larr; Website content
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[1.375rem] font-semibold tracking-[-0.02em] text-s-text">
              {meta.title}
            </h1>
            <p className="mt-1 max-w-xl text-[0.8125rem] text-s-text-3">{meta.blurb}</p>
          </div>
          <Link
            href={meta.preview}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("secondary", "md")}
          >
            View page &rarr;
          </Link>
        </div>
      </div>

      <ContentForm
        section={key}
        groups={meta.groups}
        initial={values as unknown as Record<string, unknown>}
        isEdited={Boolean(stored)}
      />
    </div>
  );
}
