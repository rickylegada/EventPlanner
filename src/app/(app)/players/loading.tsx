import { RowsSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="h-7 w-28 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
      <div className="h-11 animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800" />
      <RowsSkeleton rows={5} />
    </div>
  );
}
