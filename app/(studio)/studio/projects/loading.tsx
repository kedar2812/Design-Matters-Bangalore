import { SkeletonHeader, SkeletonRows } from "@/components/studio/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-5xl">
      <SkeletonHeader />
      <SkeletonRows rows={6} />
    </div>
  );
}
