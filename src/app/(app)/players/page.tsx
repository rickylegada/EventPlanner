import { getPlayers } from "@/server/data";
import { getCurrentPlayerId } from "@/lib/auth";
import { addPlayerAction } from "@/server/actions";
import { PlayerRow } from "@/components/PlayerRow";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const [players, meId] = await Promise.all([getPlayers(), getCurrentPlayerId()]);
  const active = players.filter((p) => p.is_active);
  const benched = players.filter((p) => !p.is_active);

  return (
    <div className="space-y-5">
      <h1 className="px-1 text-xl font-bold tracking-tight">Players</h1>

      <form action={addPlayerAction} className="flex gap-2">
        <input
          name="name"
          placeholder="Add a player…"
          required
          className="flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-stone-700 dark:bg-stone-900"
        />
        <button
          type="submit"
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Add
        </button>
      </form>

      {active.length === 0 && benched.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
          No players yet. Add your regulars here — you can also add someone on the spot
          from any event.
        </p>
      ) : (
        <ul className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900 dark:shadow-none">
          {active.map((p) => (
            <PlayerRow key={p.id} player={p} isMe={p.id === meId} />
          ))}
        </ul>
      )}

      {benched.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400">
            Not in the regular roster
          </h2>
          <ul className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white opacity-70 dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
            {benched.map((p) => (
              <PlayerRow key={p.id} player={p} isMe={p.id === meId} />
            ))}
          </ul>
        </section>
      )}

      <p className="px-1 text-xs text-stone-500 dark:text-stone-400">
        Taking someone out of the regular roster keeps all their past events and
        payments — they just stop being added to new ones automatically.
      </p>

      <div className="border-t border-stone-200 pt-4 dark:border-stone-800">
        <SignOutButton />
      </div>
    </div>
  );
}
