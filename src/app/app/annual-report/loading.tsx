import { SkeletonKpiGrid, SkeletonTable, SkeletonBlock } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-8 w-52" />
        <SkeletonBlock className="h-10 w-24 rounded-xl" />
      </div>
      <SkeletonKpiGrid count={4} />
      <SkeletonBlock className="h-64 rounded-2xl" />
      <SkeletonTable rows={5} />
    </div>
  );
}
