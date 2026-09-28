import Link from "next/link";
import { isPast } from "@/lib/dates";
import { getEventCounts, getEvents } from "@/server/data";
import { EventCard } from "@/components/EventCard";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const [events, counts] = await Promise.all([getEvents(), getEventCounts()]);

  const upcoming = events.filter((e) => !isPast(e.starts_at, e.ends_at));
  const past = events
    .filter((e) => isPast(e.starts_at, e.ends_at))
    .reverse();

  const owing = past.filter((e) => (counts[e.id]?.unpaid ?? 0) > 0);

  return (
    <div className="space-y-6">
      {owing.length > 0 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-800/60 dark:bg-amber-950/30">
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Still collecting money
          </p>
          <ul className="mt-1 space-y-0.5">
            {owing.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/events/${e.id}`}
                  className="inline-block py-1.5 text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
                >
                  {e.title} — {counts[e.id].unpaid} unpaid
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400">
          Coming up
        </h2>

        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 px-4 py-10 text-center dark:border-stone-700">
            <p className="text-3xl">🏓</p>
            <p className="mt-2 font-medium">Nothing booked yet</p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Set the next session so everyone can RSVP.
            </p>
            <Link
              href="/events/new"
              className="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              New event
            </Link>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {upcoming.map((e) => (
              <li key={e.id}>
                <EventCard event={e} counts={counts[e.id]} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none px-1 text-xs font-semibold tracking-wide text-stone-500 uppercase select-none hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
            Past events ({past.length})
            <span className="ml-1 inline-block transition group-open:rotate-90">›</span>
          </summary>
          <ul className="mt-2 space-y-2.5">
            {past.map((e) => (
              <li key={e.id}>
                <EventCard event={e} counts={counts[e.id]} past />
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
