import { RowsSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
      <div className="h-44 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
      <RowsSkeleton rows={4} />
    </div>
  );
}
