import { SkeletonCards, SkeletonHeader } from "@/components/studio/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-5xl">
      <SkeletonHeader />
      <SkeletonCards count={4} />
    </div>
  );
}
