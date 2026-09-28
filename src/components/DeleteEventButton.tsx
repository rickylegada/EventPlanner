"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteEventAction } from "@/server/actions";

export function DeleteEventButton({
  eventId,
  title,
}: {
  eventId: string;
  title: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40"
      >
        <Trash2 size={15} /> Delete this event
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-rose-300 bg-rose-50 p-3 dark:border-rose-900 dark:bg-rose-950/40">
      <p className="text-sm text-rose-900 dark:text-rose-200">
        Delete <strong>{title}</strong>? This also removes its attendance and payment
        records, and cannot be undone.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium dark:border-stone-700"
        >
          Keep it
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => deleteEventAction(eventId))}
          className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </button>
      </div>
    </div>
  );
}
