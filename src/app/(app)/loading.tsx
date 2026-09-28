import { ListSkeleton, TabsSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <TabsSkeleton />
      <ListSkeleton rows={3} />
    </div>
  );
}
