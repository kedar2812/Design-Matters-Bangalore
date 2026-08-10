import { Skeleton, SkeletonHeader } from "@/components/studio/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-5xl">
      <SkeletonHeader />
      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-s" />
        ))}
      </div>
      <Skeleton className="mt-6 h-64 w-full rounded-s" />
    </div>
  );
}
