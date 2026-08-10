import { SkeletonForm, SkeletonHeader } from "@/components/studio/Skeleton";

export default function Loading() {
  return (
    <div>
      <SkeletonHeader />
      <SkeletonForm />
    </div>
  );
}
