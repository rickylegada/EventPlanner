/**
 * Placeholder shapes shown while a tab's data is on its way. Next prefetches
 * these shells, so tapping a tab paints something immediately instead of
 * sitting on the previous screen for a round trip — which is what made
 * switching tabs feel slow, especially on a phone.
 */
const bar = "animate-pulse rounded bg-stone-200 dark:bg-stone-800";

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:shadow-none">
      <div className="flex items-start gap-3">
        <div className={`${bar} size-7 shrink-0 rounded-full`} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className={`${bar} h-4 w-2/5`} />
          <div className={`${bar} h-3 w-4/5`} />
          <div className={`${bar} h-3 w-1/3`} />
        </div>
      </div>
      <div className="mt-3 flex gap-1.5">
        <div className={`${bar} h-6 w-20 rounded-full`} />
        <div className={`${bar} h-6 w-24 rounded-full`} />
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TabsSkeleton() {
  return (
    <div
      className="mb-3 flex gap-1 rounded-xl bg-stone-200 p-1 dark:bg-stone-800"
      aria-hidden
    >
      <div className="h-8 flex-1 rounded-lg bg-white/60 dark:bg-stone-700/60" />
      <div className="h-8 flex-1" />
    </div>
  );
}

export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900 dark:shadow-none"
      aria-hidden
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-2.5 px-3 py-3">
          <div className={`${bar} size-8 shrink-0 rounded-full`} />
          <div className={`${bar} h-4 flex-1`} />
        </div>
      ))}
    </div>
  );
}
