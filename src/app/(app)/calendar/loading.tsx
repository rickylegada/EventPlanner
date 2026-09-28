import { ListSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-10 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800" />
      <div className="h-72 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
      <ListSkeleton rows={2} />
    </div>
  );
}
