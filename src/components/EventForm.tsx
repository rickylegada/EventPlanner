"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { EVENT_KINDS, type EventKind } from "@/lib/types";
import type { EventFormState } from "@/server/actions";

export type EventFormValues = {
  id?: string;
  title: string;
  kind: EventKind;
  startsAtLocal: string;
  endsAtLocal: string;
  venueName: string;
  mapsUrl: string;
  totalCost: string;
  notes: string;
};

const field =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 dark:border-stone-700 dark:bg-stone-900";

const label = "block text-xs font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

export function EventForm({
  action,
  values,
  submitLabel,
  showInviteAll = false,
  cancelHref,
}: {
  action: (state: EventFormState, form: FormData) => Promise<EventFormState>;
  values: EventFormValues;
  submitLabel: string;
  showInviteAll?: boolean;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState<EventFormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <fieldset>
        <legend className={label}>Type</legend>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {EVENT_KINDS.map((k) => (
            <label
              key={k.value}
              className="cursor-pointer rounded-xl border border-stone-300 bg-white px-2 py-2.5 text-center text-sm transition has-checked:border-emerald-500 has-checked:bg-emerald-50 has-checked:font-semibold has-checked:text-emerald-800 dark:border-stone-700 dark:bg-stone-900 dark:has-checked:bg-emerald-950 dark:has-checked:text-emerald-300"
            >
              <input
                type="radio"
                name="kind"
                value={k.value}
                defaultChecked={values.kind === k.value}
                className="sr-only"
              />
              <span aria-hidden>{k.emoji}</span> {k.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className={label} htmlFor="title">
          Event name
        </label>
        <input
          id="title"
          name="title"
          defaultValue={values.title}
          placeholder="Saturday Pickleball"
          required
          className={`mt-1.5 ${field}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="starts_at">
            Starts
          </label>
          <input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            defaultValue={values.startsAtLocal}
            required
            className={`mt-1.5 ${field}`}
          />
        </div>
        <div>
          <label className={label} htmlFor="ends_at">
            Ends <span className="font-normal normal-case">(optional)</span>
          </label>
          <input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            defaultValue={values.endsAtLocal}
            className={`mt-1.5 ${field}`}
          />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="venue_name">
          Venue
        </label>
        <input
          id="venue_name"
          name="venue_name"
          defaultValue={values.venueName}
          placeholder="Ace Pickleball Court"
          className={`mt-1.5 ${field}`}
        />
      </div>

      <div>
        <label className={label} htmlFor="maps_url">
          Google Maps link
        </label>
        <input
          id="maps_url"
          name="maps_url"
          type="url"
          inputMode="url"
          defaultValue={values.mapsUrl}
          placeholder="https://maps.app.goo.gl/…"
          className={`mt-1.5 ${field}`}
        />
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          Share the place in Google Maps and paste the link here.
        </p>
      </div>

      <div>
        <label className={label} htmlFor="total_cost">
          Total cost
        </label>
        <div className="relative mt-1.5">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400">
            ₱
          </span>
          <input
            id="total_cost"
            name="total_cost"
            inputMode="decimal"
            defaultValue={values.totalCost}
            placeholder="2000"
            className={`${field} pl-7`}
          />
        </div>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          Split between whoever actually shows up. Leave blank if nobody is paying.
        </p>
      </div>

      <div>
        <label className={label} htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={values.notes}
          placeholder="Bring your own paddle…"
          className={`mt-1.5 ${field}`}
        />
      </div>

      {showInviteAll && (
        <label className="flex items-center gap-2.5 rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm dark:border-stone-700 dark:bg-stone-900">
          <input
            type="checkbox"
            name="invite_all"
            defaultChecked
            className="size-4 accent-emerald-600"
          />
          Add everyone in the roster so they can RSVP
        </label>
      )}

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
          {state.error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Link
          href={cancelHref}
          className="rounded-xl border border-stone-300 px-4 py-3 text-sm font-medium text-stone-600 transition hover:bg-stone-200 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          Cancel
        </Link>
        <div className="flex-1">
          <SubmitButton>{submitLabel}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
