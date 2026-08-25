import Link from "next/link";
import { prisma } from "@/lib/db";
import { SECTIONS } from "@/lib/content-schema";
import { formatDate } from "@/lib/utils";
import { Badge, PageHead } from "@/components/studio/ui";
import { Reveal } from "@/components/studio/Reveal";
import { ChevronIcon } from "@/components/studio/icons";

export const metadata = { title: "Studio | Website content" };

export default async function ContentIndex() {
  const rows = await prisma.siteSetting.findMany({
    select: { key: true, updatedAt: true },
  });
  const edited = new Map(rows.map((r) => [r.key, r.updatedAt]));

  return (
    <div>
      <PageHead
        title="Website content"
        subtitle="Every word on the public site, editable here. Changes go live the moment you save."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((s, i) => {
          const at = edited.get(s.key);
          return (
            <Reveal key={s.key} delay={Math.min(i * 0.04, 0.32)} className="h-full">
              <Link
                href={`/studio/content/${s.key}`}
                className="group flex h-full flex-col rounded-s border border-s-border bg-s-surface p-4 shadow-s transition-colors hover:border-s-border-strong"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-s-text transition-colors group-hover:text-s-accent">
                    {s.title}
                  </h2>
                  <ChevronIcon className="mt-0.5 size-4 shrink-0 text-s-text-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-s-accent" />
                </div>
                <p className="text-[0.8125rem] leading-relaxed text-s-text-2">{s.blurb}</p>
                <div className="mt-4 pt-1">
                  {at ? (
                    <Badge tone="accent">Edited {formatDate(at)}</Badge>
                  ) : (
                    <Badge tone="neutral">Original</Badge>
                  )}
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
