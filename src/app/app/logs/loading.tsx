import { SkeletonTable, SkeletonBlock } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-9 w-20 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <SkeletonBlock key={i} className="h-16 rounded-2xl" />)}
      </div>
      <SkeletonBlock className="h-28 rounded-2xl" />
      <SkeletonTable rows={8} />
    </div>
  );
}
