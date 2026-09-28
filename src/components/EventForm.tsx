"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Clock } from "lucide-react";
import { formatMinutes, minutesBetweenClockTimes } from "@/lib/dates";
import { EVENT_KINDS, type EventKind } from "@/lib/types";
import type { EventFormState } from "@/server/actions";

export type EventFormValues = {
  id?: string;
  title: string;
  kind: EventKind;
  date: string;
  startTime: string;
  endTime: string;
  venueName: string;
  mapsUrl: string;
  totalCost: string;
  notes: string;
  gcashName: string;
  gcashNumber: string;
  qrOneLabel: string;
  qrTwoLabel: string;
};

const field =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 dark:border-stone-700 dark:bg-stone-900";

const label =
  "block text-xs font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400";

/**
 * By default a date or time input only opens its picker when you hit the tiny
 * icon, which is fiddly on a phone. This opens it from a tap anywhere in the
 * field. showPicker() needs a user gesture and is not in every browser, so a
 * failure just leaves the normal behaviour in place.
 */
function openPickerOnTap(e: React.MouseEvent<HTMLInputElement>) {
  const input = e.currentTarget;
  if (typeof input.showPicker !== "function") return;
  try {
    input.showPicker();
  } catch {
    /* Unsupported, or no user activation — the field still works as normal. */
  }
}

/** Full-width tap area and a picker that opens from anywhere in the field. */
const dateField = `${field} cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer`;

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
  const [startTime, setStartTime] = useState(values.startTime);
  const [endTime, setEndTime] = useState(values.endTime);
  const [cost, setCost] = useState(values.totalCost);

  const span = useMemo(
    () => minutesBetweenClockTimes(startTime, endTime),
    [startTime, endTime],
  );
  const overnight = span !== null && endTime < startTime;

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

      {/* One day, one date, two times — with the length worked out for you. */}
      <div className="space-y-3 rounded-xl border border-stone-300 bg-white p-3 dark:border-stone-700 dark:bg-stone-900">
        <div>
          <label className={label} htmlFor="event_date">
            Date
          </label>
          <input
            id="event_date"
            name="event_date"
            type="date"
            defaultValue={values.date}
            required
            onClick={openPickerOnTap}
            className={`mt-1.5 ${dateField}`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="start_time">
              Starts
            </label>
            <input
              id="start_time"
              name="start_time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              onClick={openPickerOnTap}
              className={`mt-1.5 ${dateField}`}
            />
          </div>
          <div>
            <label className={label} htmlFor="end_time">
              Ends
            </label>
            <input
              id="end_time"
              name="end_time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              onClick={openPickerOnTap}
              className={`mt-1.5 ${dateField}`}
            />
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-300">
          <Clock size={14} className="shrink-0 text-stone-400" />
          {span === null ? (
            <span className="text-stone-500 dark:text-stone-400">
              Add an end time to see how long it runs.
            </span>
          ) : (
            <>
              <strong className="text-emerald-700 dark:text-emerald-400">
                {formatMinutes(span)}
              </strong>
              {overnight && (
                <span className="text-stone-500 dark:text-stone-400">
                  · ends the next morning
                </span>
              )}
            </>
          )}
        </p>
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
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="2000"
            className={`${field} pl-7`}
          />
        </div>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          Split between whoever actually shows up. Leave blank if nobody is paying.
        </p>
      </div>

      {/* Only worth asking about once there is money involved. */}
      {cost.trim() !== "" && (
        <fieldset className="space-y-3 rounded-xl border border-stone-300 bg-white p-3 dark:border-stone-700 dark:bg-stone-900">
          <legend className={`${label} px-1`}>How people pay you</legend>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Shown to everyone who owes money. You can add the QR images after saving.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="gcash_name">
                Account name
              </label>
              <input
                id="gcash_name"
                name="gcash_name"
                defaultValue={values.gcashName}
                placeholder="Ricky L."
                className={`mt-1.5 ${field}`}
              />
            </div>
            <div>
              <label className={label} htmlFor="gcash_number">
                GCash number
              </label>
              <input
                id="gcash_number"
                name="gcash_number"
                inputMode="tel"
                defaultValue={values.gcashNumber}
                placeholder="0917 123 4567"
                className={`mt-1.5 ${field}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="qr_one_label">
                QR 1 label
              </label>
              <input
                id="qr_one_label"
                name="qr_one_label"
                defaultValue={values.qrOneLabel}
                placeholder="GCash"
                className={`mt-1.5 ${field}`}
              />
            </div>
            <div>
              <label className={label} htmlFor="qr_two_label">
                QR 2 label
              </label>
              <input
                id="qr_two_label"
                name="qr_two_label"
                defaultValue={values.qrTwoLabel}
                placeholder="BPI / Maya"
                className={`mt-1.5 ${field}`}
              />
            </div>
          </div>
        </fieldset>
      )}

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
