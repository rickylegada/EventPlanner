import { getCurrentPlayerId } from "@/lib/auth";
import { getPlayers } from "@/server/data";
import { chooseMeAction } from "@/server/actions";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const [players, meId] = await Promise.all([getPlayers(), getCurrentPlayerId()]);

  return (
    <div className="space-y-5">
      <div className="px-1">
        <h1 className="text-xl font-bold tracking-tight">Which one are you?</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Just so your own row stands out. Everyone can still edit everything.
        </p>
      </div>

      {players.length > 0 && (
        <form action={chooseMeAction}>
          <ul className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
            {players.map((p) => (
              <li key={p.id}>
                <button
                  type="submit"
                  name="playerId"
                  value={p.id}
                  className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition hover:bg-stone-100 dark:hover:bg-stone-800 ${
                    p.id === meId ? "bg-emerald-50 dark:bg-emerald-950/40" : ""
                  }`}
                >
                  <Avatar name={p.name} color={p.color} />
                  <span className="flex-1 font-medium">{p.name}</span>
                  {p.id === meId && (
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      that&apos;s you
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </form>
      )}

      <form action={chooseMeAction} className="space-y-2">
        <label
          htmlFor="newName"
          className="block px-1 text-xs font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400"
        >
          Not on the list?
        </label>
        <div className="flex gap-2">
          <input
            id="newName"
            name="newName"
            placeholder="Your name"
            required
            className="flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-stone-700 dark:bg-stone-900"
          />
          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            That&apos;s me
          </button>
        </div>
      </form>
    </div>
  );
}
