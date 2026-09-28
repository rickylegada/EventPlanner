import Link from "next/link";
import { eventPhase, manilaDateKey } from "@/lib/dates";
import { getEventSummaries, getEvents } from "@/server/data";
import { EventCard } from "@/components/EventCard";
import { EventsTabs } from "@/components/EventsTabs";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const [events, summaries] = await Promise.all([getEvents(), getEventSummaries()]);

  const today = manilaDateKey(new Date());
  const notPast = events.filter((e) => eventPhase(e.starts_at, e.ends_at) !== "past");
  const past = events
    .filter((e) => eventPhase(e.starts_at, e.ends_at) === "past")
    .reverse();

  // Anything on today's date is pinned to the top in its own group — it is the
  // thing you opened the app for.
  const todays = notPast.filter((e) => manilaDateKey(e.starts_at) === today);
  const later = notPast.filter((e) => manilaDateKey(e.starts_at) !== today);

  const owing = past.filter((e) => (summaries[e.id]?.unpaid ?? 0) > 0);

  const cards = (list: typeof events) => (
    <ul className="space-y-2.5">
      {list.map((e) => (
        <li key={e.id}>
          <EventCard event={e} summary={summaries[e.id]} />
        </li>
      ))}
    </ul>
  );

  const upcomingPanel =
    notPast.length === 0 ? (
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
      <div className="space-y-5">
        {todays.length > 0 && (
          <section>
            <h3 className="mb-2 flex items-center gap-2 px-1 text-xs font-bold tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
              Today
            </h3>
            {/* An emerald rail down the side so Today reads as one block. */}
            <div className="border-l-2 border-emerald-500 pl-2.5">{cards(todays)}</div>
          </section>
        )}

        {later.length > 0 && (
          <section>
            {todays.length > 0 && (
              <h3 className="mb-2 px-1 text-xs font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400">
                Coming up
              </h3>
            )}
            {cards(later)}
          </section>
        )}
      </div>
    );

  const pastPanel =
    past.length === 0 ? (
      <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
        Nothing has happened yet.
      </p>
    ) : (
      cards(past)
    );

  return (
    <div className="space-y-4">
      {/* Money owed matters whichever tab you are on, so it sits above both. */}
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
                  {e.title} — {summaries[e.id].unpaid} unpaid
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <EventsTabs
        upcoming={upcomingPanel}
        past={pastPanel}
        pastCount={past.length}
        owedCount={owing.length}
      />
    </div>
  );
}
