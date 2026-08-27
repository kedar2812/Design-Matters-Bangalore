import { SkeletonHeader, SkeletonRows } from "@/components/studio/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-2xl">
      <SkeletonHeader />
      <SkeletonRows rows={3} thumb={false} />
    </div>
  );
}
