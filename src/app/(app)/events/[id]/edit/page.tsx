import { notFound } from "next/navigation";
import { toDateAndTimes } from "@/lib/dates";
import { getEvent, getPlayers, signQr } from "@/server/data";
import { updateEventAction } from "@/server/actions";
import { canManageEvent, getViewer, manageDeniedReason } from "@/server/permissions";
import { EventForm } from "@/components/EventForm";
import { DeleteEventButton } from "@/components/DeleteEventButton";
import { QrUpload } from "@/components/QrUpload";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event, viewer, players] = await Promise.all([
    getEvent(id),
    getViewer(),
    getPlayers(),
  ]);
  if (!event) notFound();

  const times = toDateAndTimes(event.starts_at, event.ends_at);
  const canManage = canManageEvent(viewer, event);
  const organiser = players.find((p) => p.id === event.created_by) ?? null;

  const [qrOne, qrTwo] = await Promise.all([
    signQr(event.qr_one_path),
    signQr(event.qr_two_path),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="px-1 text-xl font-bold tracking-tight">Edit event</h1>

      {organiser && (
        <p className="px-1 text-xs text-stone-500 dark:text-stone-400">
          Created by {organiser.name}
        </p>
      )}

      <EventForm
        action={updateEventAction}
        submitLabel="Save changes"
        cancelHref={`/events/${event.id}`}
        values={{
          id: event.id,
          title: event.title,
          kind: event.kind,
          date: times.date,
          startTime: times.startTime,
          endTime: times.endTime,
          venueName: event.venue_name ?? "",
          mapsUrl: event.maps_url ?? "",
          totalCost: event.total_cost != null ? String(event.total_cost) : "",
          notes: event.notes ?? "",
          gcashName: event.gcash_name ?? "",
          gcashNumber: event.gcash_number ?? "",
          qrOneLabel: event.qr_one_label ?? "",
          qrTwoLabel: event.qr_two_label ?? "",
        }}
      />

      {event.total_cost != null && (
        <section className="space-y-3 border-t border-stone-200 pt-4 dark:border-stone-800">
          <div className="px-1">
            <h2 className="text-sm font-semibold">Payment QR codes</h2>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              Uploads save straight away. Everyone who owes money sees these under
              &ldquo;How to pay&rdquo;.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <QrUpload
              eventId={event.id}
              slot="one"
              label={event.qr_one_label || "GCash"}
              signedUrl={qrOne}
            />
            <QrUpload
              eventId={event.id}
              slot="two"
              label={event.qr_two_label || "Bank / other"}
              signedUrl={qrTwo}
            />
          </div>
        </section>
      )}

      <div className="border-t border-stone-200 pt-4 dark:border-stone-800">
        {canManage ? (
          <DeleteEventButton eventId={event.id} title={event.title} />
        ) : (
          <p className="rounded-xl border border-stone-200 px-3 py-2.5 text-center text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
            {manageDeniedReason(viewer, event)}
          </p>
        )}
      </div>
    </div>
  );
}
