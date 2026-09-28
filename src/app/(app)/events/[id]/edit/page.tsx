import { notFound } from "next/navigation";
import { toLocalInputValue } from "@/lib/dates";
import { getEvent } from "@/server/data";
import { updateEventAction } from "@/server/actions";
import { EventForm } from "@/components/EventForm";
import { DeleteEventButton } from "@/components/DeleteEventButton";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  return (
    <div className="space-y-4">
      <h1 className="px-1 text-xl font-bold tracking-tight">Edit event</h1>

      <EventForm
        action={updateEventAction}
        submitLabel="Save changes"
        cancelHref={`/events/${event.id}`}
        values={{
          id: event.id,
          title: event.title,
          kind: event.kind,
          startsAtLocal: toLocalInputValue(event.starts_at),
          endsAtLocal: event.ends_at ? toLocalInputValue(event.ends_at) : "",
          venueName: event.venue_name ?? "",
          mapsUrl: event.maps_url ?? "",
          totalCost: event.total_cost != null ? String(event.total_cost) : "",
          notes: event.notes ?? "",
        }}
      />

      <div className="border-t border-stone-200 pt-4 dark:border-stone-800">
        <DeleteEventButton eventId={event.id} title={event.title} />
      </div>
    </div>
  );
}
