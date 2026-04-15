import { SkeletonStudentGrid, SkeletonBlock } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-40" />
          <SkeletonBlock className="h-4 w-56" />
        </div>
        <SkeletonBlock className="h-10 w-28 rounded-xl" />
      </div>
      {/* Filter bar */}
      <SkeletonBlock className="h-24 rounded-2xl" />
      {/* Grid */}
      <SkeletonStudentGrid count={6} />
    </div>
  );
}
