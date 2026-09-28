"use client";

import { useState, useTransition } from "react";
import { UserPlus, UserRoundPlus, X } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import type { Participant, Rsvp } from "@/lib/types";
import {
  addParticipantAction,
  inviteRosterAction,
  removeParticipantAction,
  setRsvpAction,
} from "@/server/actions";

const CHOICES: { value: Rsvp; short: string }[] = [
  { value: "going", short: "In" },
  { value: "maybe", short: "Maybe" },
  { value: "out", short: "Out" },
];

const CHOICE_TONE: Record<Rsvp, string> = {
  going: "bg-emerald-600 text-white",
  maybe: "bg-amber-500 text-white",
  out: "bg-stone-500 text-white",
  no_reply: "",
};

export function RsvpPanel({
  eventId,
  participants,
  meId,
  missingFromRoster,
}: {
  eventId: string;
  participants: Participant[];
  meId: string | null;
  missingFromRoster: number;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");

  const count = (r: Rsvp) => participants.filter((p) => p.rsvp === r).length;

  function add() {
    const clean = name.trim();
    if (!clean) return;
    setName("");
    startTransition(() => addParticipantAction(eventId, clean));
  }

  return (
    <div className={pending ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <div className="mb-3 flex items-center gap-2 text-sm">
        <Tally tone="text-emerald-700 dark:text-emerald-400" n={count("going")} label="going" />
        <Tally tone="text-amber-700 dark:text-amber-400" n={count("maybe")} label="maybe" />
        <Tally tone="text-stone-500 dark:text-stone-400" n={count("out")} label="out" />
        <Tally
          tone="text-stone-400 dark:text-stone-500"
          n={count("no_reply")}
          label="no reply"
        />
      </div>

      {participants.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
          Nobody added yet. Add players below.
        </p>
      ) : (
        <ul className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900 dark:shadow-none">
          {participants.map((p) => (
            <li key={p.id} className="flex items-center gap-2 px-2.5 py-2">
              <Avatar name={p.player.name} color={p.player.color} />

              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {p.player.name}
                {p.player_id === meId && (
                  <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    you
                  </span>
                )}
              </span>

              <div className="flex shrink-0 overflow-hidden rounded-lg border border-stone-300 dark:border-stone-700">
                {CHOICES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    aria-pressed={p.rsvp === c.value}
                    onClick={() =>
                      startTransition(() =>
                        setRsvpAction(
                          eventId,
                          p.id,
                          p.rsvp === c.value ? "no_reply" : c.value,
                        ),
                      )
                    }
                    className={`px-2.5 py-3 text-xs font-semibold transition ${
                      p.rsvp === c.value
                        ? CHOICE_TONE[c.value]
                        : "text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
                    }`}
                  >
                    {c.short}
                  </button>
                ))}
              </div>

              <button
                type="button"
                title={`Remove ${p.player.name} from this event`}
                onClick={() =>
                  startTransition(() => removeParticipantAction(eventId, p.id))
                }
                className="shrink-0 rounded p-2 text-stone-300 transition hover:text-rose-500 dark:text-stone-600"
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <UserPlus
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Add a player…"
            className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:border-emerald-500 dark:border-stone-700 dark:bg-stone-900"
          />
        </div>
        <button
          type="button"
          onClick={add}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Add
        </button>
      </div>

      {missingFromRoster > 0 && (
        <button
          type="button"
          onClick={() => startTransition(() => inviteRosterAction(eventId))}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-200 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          <UserRoundPlus size={15} />
          Add the other {missingFromRoster} from the roster
        </button>
      )}
    </div>
  );
}

function Tally({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <span className={`${tone}`}>
      <strong className="text-base">{n}</strong>{" "}
      <span className="text-xs">{label}</span>
    </span>
  );
}
