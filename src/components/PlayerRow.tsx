"use client";

import { useState, useTransition } from "react";
import { Check, Trash2, UserMinus, UserPlus } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import type { Player } from "@/lib/types";
import {
  deletePlayerAction,
  renamePlayerAction,
  setPlayerActiveAction,
} from "@/server/actions";

export function PlayerRow({ player, isMe }: { player: Player; isMe: boolean }) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(player.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <li className={`px-2.5 py-2 ${pending ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-2.5">
        <Avatar name={player.name} color={player.color} />

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name.trim() && name !== player.name) {
              startTransition(() => renamePlayerAction(player.id, name));
            } else if (!name.trim()) {
              setName(player.name);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          aria-label={`Name for ${player.name}`}
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-sm font-medium outline-none hover:border-stone-200 focus:border-emerald-500 focus:bg-white dark:hover:border-stone-700 dark:focus:bg-stone-950"
        />

        {isMe && (
          <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            you
          </span>
        )}

        <button
          type="button"
          title={
            player.is_active
              ? "Take out of the regular roster"
              : "Put back in the regular roster"
          }
          onClick={() =>
            startTransition(() => setPlayerActiveAction(player.id, !player.is_active))
          }
          className="shrink-0 rounded p-2.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
        >
          {player.is_active ? <UserMinus size={15} /> : <UserPlus size={15} />}
        </button>

        <button
          type="button"
          title={`Delete ${player.name}`}
          onClick={() => setConfirmDelete((v) => !v)}
          className="shrink-0 rounded p-2.5 text-stone-300 transition hover:bg-rose-50 hover:text-rose-600 dark:text-stone-600 dark:hover:bg-rose-950/40"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {confirmDelete && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          <span className="flex-1">
            Delete {player.name} and every event record they are in?
          </span>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="rounded px-2 py-1 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => startTransition(() => deletePlayerAction(player.id))}
            className="flex items-center gap-1 rounded bg-rose-600 px-2 py-1 font-semibold text-white"
          >
            <Check size={12} /> Delete
          </button>
        </div>
      )}
    </li>
  );
}
