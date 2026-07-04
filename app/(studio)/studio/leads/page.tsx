import { prisma } from "@/lib/db";
import { EnquiryRow } from "@/components/studio/EnquiryRow";
import { STAGES } from "@/lib/lead-stages";

export const metadata = { title: "Studio — Enquiries" };

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage } = await searchParams;
  const valid = STAGES.map(([v]) => v as string);
  const filter = stage && valid.includes(stage) ? stage : undefined;

  const [leads, counts] = await Promise.all([
    prisma.lead.findMany({
      where: filter ? { status: filter as never } : undefined,
      orderBy: { createdAt: "desc" },
    }),
    prisma.lead.groupBy({ by: ["status"], _count: true }),
  ]);

  const countFor = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const total = counts.reduce((sum, c) => sum + c._count, 0);

  return (
    <div className="max-w-5xl">
      <header className="mb-10">
        <p className="mono-label mb-2">Enquiries</p>
        <h1 className="font-display text-h2">
          The pipeline, in one place.
        </h1>
      </header>

      {/* Stage rail */}
      <div className="rule flex flex-wrap gap-x-7 gap-y-3 pt-4">
        <a
          href="/studio/leads"
          className={`mono-label transition-colors hover:text-ink ${!filter ? "text-brass" : ""}`}
        >
          All ({total})
        </a>
        {STAGES.map(([value, label]) => (
          <a
            key={value}
            href={`/studio/leads?stage=${value}`}
            className={`mono-label transition-colors hover:text-ink ${filter === value ? "text-brass" : ""}`}
          >
            {label} ({countFor(value)})
          </a>
        ))}
      </div>

      {leads.length === 0 ? (
        <p className="mt-10 text-sm text-stone">
          {filter
            ? "No enquiries at this stage."
            : "No enquiries yet — everything submitted through the contact page lands here."}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-hairline">
          {leads.map((lead) => (
            <EnquiryRow
              key={lead.id}
              enquiry={{
                ...lead,
                createdAt: lead.createdAt.toISOString(),
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
