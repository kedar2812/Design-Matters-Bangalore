import { Skeleton, SkeletonHeader } from "@/components/studio/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-3xl">
      <SkeletonHeader />
      <div className="space-y-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-s border border-s-border bg-s-surface p-5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-4 h-10 w-full" />
            <Skeleton className="mt-3 h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
