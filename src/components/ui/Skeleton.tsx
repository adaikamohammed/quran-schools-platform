/**
 * Reusable Skeleton primitives for consistent loading states across all pages
 */

// ─── Primitive skeleton block ─────────────────────────────
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-xl ${className}`} />;
}

// ─── Skeleton for a stat card (KPI) ──────────────────────
export function SkeletonKpiCard() {
  return (
    <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5">
      <SkeletonBlock className="w-10 h-10 rounded-xl mb-3" />
      <SkeletonBlock className="h-7 w-20 mb-2" />
      <SkeletonBlock className="h-3 w-28 mb-1" />
      <SkeletonBlock className="h-2.5 w-20" />
    </div>
  );
}

// ─── Skeleton for a student card ─────────────────────────
export function SkeletonStudentCard() {
  return (
    <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5">
      <div className="flex gap-3 mb-4">
        <SkeletonBlock className="w-12 h-12 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <SkeletonBlock className="h-4 w-3/4" />
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
      </div>
      <div className="h-px bg-gray-100 dark:bg-white/5 mb-4" />
      <div className="grid grid-cols-3 gap-2">
        {[...Array(3)].map((_, j) => <SkeletonBlock key={j} className="h-12" />)}
      </div>
    </div>
  );
}

// ─── Grid of skeleton student cards ──────────────────────
export function SkeletonStudentGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => <SkeletonStudentCard key={i} />)}
    </div>
  );
}

// ─── Skeleton for KPI grid row ────────────────────────────
export function SkeletonKpiGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => <SkeletonKpiCard key={i} />)}
    </div>
  );
}

// ─── Skeleton for a table row ─────────────────────────────
export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-white/5">
      <SkeletonBlock className="w-8 h-8 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-4 w-2/3" />
        <SkeletonBlock className="h-3 w-1/3" />
      </div>
      <SkeletonBlock className="w-16 h-6 rounded-lg shrink-0" />
    </div>
  );
}

// ─── Table skeleton ───────────────────────────────────────
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
      <SkeletonBlock className="h-12 rounded-none rounded-t-2xl" />
      {[...Array(rows)].map((_, i) => <SkeletonTableRow key={i} />)}
    </div>
  );
}

// ─── Skeleton for the full page ───────────────────────────
export function SkeletonPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-48" />
          <SkeletonBlock className="h-4 w-72" />
        </div>
        <SkeletonBlock className="h-10 w-28 rounded-xl" />
      </div>
      {/* KPIs */}
      <SkeletonKpiGrid />
      {/* Chart */}
      <SkeletonBlock className="h-52 rounded-2xl" />
      {/* Table */}
      <SkeletonTable rows={4} />
    </div>
  );
}

// ─── Inline spinner ───────────────────────────────────────
export function SpinnerCenter({ text = "جارٍ التحميل..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
      <div className="w-10 h-10 rounded-full border-3 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] animate-spin" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}
