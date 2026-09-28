import { manilaDateKey } from "@/lib/dates";
import { createEventAction } from "@/server/actions";
import { EventForm } from "@/components/EventForm";

export const dynamic = "force-dynamic";

export default function NewEventPage() {
  // Default to tomorrow at 6pm Manila — the usual slot, and easy to change.
  const tomorrow = manilaDateKey(new Date(Date.now() + 86_400_000));

  return (
    <div className="space-y-4">
      <h1 className="px-1 text-xl font-bold tracking-tight">New event</h1>
      <EventForm
        action={createEventAction}
        submitLabel="Create event"
        cancelHref="/"
        showInviteAll
        values={{
          title: "",
          kind: "pickleball",
          date: tomorrow,
          startTime: "18:00",
          endTime: "20:00",
          venueName: "",
          mapsUrl: "",
          totalCost: "",
          notes: "",
          gcashName: "",
          gcashNumber: "",
          qrOneLabel: "",
          qrTwoLabel: "",
        }}
      />
    </div>
  );
}
