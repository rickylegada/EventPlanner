"use client";

import { useState, useTransition } from "react";
import { Check, CheckCheck, UserPlus } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { formatPeso, type MoneySplit } from "@/lib/money";
import type { Participant, Rsvp } from "@/lib/types";

/** Shown next to anyone not yet ticked off, so the RSVP is not lost. */
const RSVP_HINT: Record<Rsvp, string> = {
  going: "said in",
  maybe: "maybe",
  out: "said out",
  no_reply: "",
};
import {
  addParticipantAction,
  markGoingAsAttendedAction,
  setAttendedAction,
  setPaidAction,
  setPaidNoteAction,
  setShareOverrideAction,
} from "@/server/actions";

export function MoneyPanel({
  eventId,
  participants,
  split,
  totalCost,
  meId,
}: {
  eventId: string;
  participants: Participant[];
  split: MoneySplit;
  totalCost: number | null;
  meId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [walkIn, setWalkIn] = useState("");

  const hasMoney = totalCost != null && totalCost > 0;
  const pendingGoing = participants.filter((p) => p.rsvp === "going" && !p.attended);

  function addWalkIn() {
    const clean = walkIn.trim();
    if (!clean) return;
    setWalkIn("");
    startTransition(() => addParticipantAction(eventId, clean, true));
  }

  return (
    <div className={pending ? "opacity-60 transition-opacity" : "transition-opacity"}>
      {hasMoney && <MoneyHeader split={split} />}
      {hasMoney && <Warning warning={split.warning} />}

      {pendingGoing.length > 0 && (
        <button
          type="button"
          onClick={() => startTransition(() => markGoingAsAttendedAction(eventId))}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <CheckCheck size={16} />
          Mark the {pendingGoing.length} who said they are in as here
        </button>
      )}

      {participants.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
          Nobody on this event yet. Add whoever turned up below.
        </p>
      ) : (
        <ul className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
          {participants.map((p) => (
            <AttendanceRow
              key={p.id}
              eventId={eventId}
              participant={p}
              share={split.byPlayer[p.player_id]?.share ?? 0}
              isOverride={split.byPlayer[p.player_id]?.isOverride ?? false}
              hasMoney={hasMoney}
              isMe={p.player_id === meId}
              busy={pending}
              run={startTransition}
            />
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
            value={walkIn}
            onChange={(e) => setWalkIn(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addWalkIn();
              }
            }}
            placeholder="Someone who just showed up…"
            className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:border-emerald-500 dark:border-stone-700 dark:bg-stone-900"
          />
        </div>
        <button
          type="button"
          onClick={addWalkIn}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Add
        </button>
      </div>

      {!hasMoney && (
        <p className="mt-3 text-center text-xs text-stone-500 dark:text-stone-400">
          No cost set for this event. Add one by editing the event and the shares will
          appear here.
        </p>
      )}
    </div>
  );
}

function MoneyHeader({ split }: { split: MoneySplit }) {
  const pct =
    split.assigned > 0 ? Math.round((split.collected / split.assigned) * 100) : 0;

  return (
    <div className="mb-3 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold">{formatPeso(split.total)}</span>
        <span className="text-sm text-stone-500 dark:text-stone-400">
          {split.attendeeCount} {split.attendeeCount === 1 ? "person" : "people"} came
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-sm">
        <span className="text-emerald-700 dark:text-emerald-400">
          {formatPeso(split.collected)} collected
        </span>
        <span
          className={
            split.outstanding > 0
              ? "font-semibold text-amber-700 dark:text-amber-400"
              : "text-stone-500 dark:text-stone-400"
          }
        >
          {split.outstanding > 0
            ? `${formatPeso(split.outstanding)} to go`
            : split.assigned > 0
              ? "All settled"
              : "Nothing to split yet"}
        </span>
      </div>
    </div>
  );
}

function Warning({ warning }: { warning: MoneySplit["warning"] }) {
  if (warning === "none") return null;

  const text = {
    "no-attendees":
      "This event has a cost but nobody is marked as here yet, so there is nothing to split.",
    "overrides-exceed-total":
      "The custom amounts add up to more than the event total. Check them.",
    "unallocated-remainder":
      "Everyone has a custom amount and they do not add up to the total.",
  }[warning];

  return (
    <p className="mb-3 rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
      {text}
    </p>
  );
}

function AttendanceRow({
  eventId,
  participant: p,
  share,
  isOverride,
  hasMoney,
  isMe,
  busy,
  run,
}: {
  eventId: string;
  participant: Participant;
  share: number;
  isOverride: boolean;
  hasMoney: boolean;
  isMe: boolean;
  busy: boolean;
  run: (fn: () => void) => void;
}) {
  return (
    <li className={p.attended ? "" : "bg-stone-50/60 dark:bg-stone-950/30"}>
      <div className="flex items-center gap-2.5 px-2.5 py-2">
        {/*
          The box stays 28px visually but the button is padded out to a 44px
          tap target — this is the control everyone jabs at on a phone.
        */}
        <button
          type="button"
          role="checkbox"
          aria-checked={p.attended}
          aria-label={`${p.player.name} came`}
          disabled={busy}
          onClick={() => run(() => setAttendedAction(eventId, p.id, !p.attended))}
          className="-m-2 shrink-0 p-2"
        >
          <span
            className={`flex size-7 items-center justify-center rounded-md border-2 transition ${
              p.attended
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-stone-300 dark:border-stone-600"
            }`}
          >
            {p.attended && <Check size={14} strokeWidth={3.5} />}
          </span>
        </button>

        <Avatar name={p.player.name} color={p.player.color} />

        <span
          className={`min-w-0 flex-1 truncate text-sm ${
            p.attended ? "font-medium" : "text-stone-400 dark:text-stone-500"
          }`}
        >
          {p.player.name}
          {isMe && (
            <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              you
            </span>
          )}
          {/* Carries the RSVP over so you still know who had said they'd come. */}
          {!p.attended && p.rsvp !== "no_reply" && (
            <span className="ml-1.5 rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-400">
              {RSVP_HINT[p.rsvp]}
            </span>
          )}
        </span>

        {p.attended && hasMoney && (
          <>
            <ShareCell
              eventId={eventId}
              rowId={p.id}
              share={share}
              isOverride={isOverride}
              run={run}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => setPaidAction(eventId, p.id, !p.paid))}
              className={`shrink-0 rounded-lg px-2.5 py-2.5 text-xs font-semibold transition ${
                p.paid
                  ? "bg-emerald-600 text-white"
                  : "border border-amber-400 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
              }`}
            >
              {p.paid ? "Paid" : "Unpaid"}
            </button>
          </>
        )}
      </div>

      {p.attended && hasMoney && p.paid && (
        <NoteRow eventId={eventId} rowId={p.id} note={p.paid_note ?? ""} run={run} />
      )}
    </li>
  );
}

/** Shows the computed share; tap it to type a custom amount for that person. */
function ShareCell({
  eventId,
  rowId,
  share,
  isOverride,
  run,
}: {
  eventId: string;
  rowId: string;
  share: number;
  isOverride: boolean;
  run: (fn: () => void) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  function commit() {
    setEditing(false);
    run(() => setShareOverrideAction(eventId, rowId, draft));
  }

  if (editing) {
    return (
      <input
        autoFocus
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        placeholder="auto"
        className="w-20 shrink-0 rounded-lg border border-emerald-500 bg-white px-2 py-2 text-right text-sm outline-none dark:bg-stone-900"
      />
    );
  }

  return (
    <button
      type="button"
      title={isOverride ? "Custom amount — tap to change, clear to reset" : "Tap to set a custom amount"}
      onClick={() => {
        setDraft(isOverride ? String(share) : "");
        setEditing(true);
      }}
      className={`shrink-0 rounded-lg px-2 py-2.5 text-sm tabular-nums transition hover:bg-stone-100 dark:hover:bg-stone-800 ${
        isOverride
          ? "font-semibold text-sky-700 underline decoration-dotted underline-offset-4 dark:text-sky-400"
          : "font-medium"
      }`}
    >
      {formatPeso(share)}
    </button>
  );
}

function NoteRow({
  eventId,
  rowId,
  note,
  run,
}: {
  eventId: string;
  rowId: string;
  note: string;
  run: (fn: () => void) => void;
}) {
  const [draft, setDraft] = useState(note);

  return (
    <div className="px-2.5 pb-2 pl-[4.25rem]">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== note) run(() => setPaidNoteAction(eventId, rowId, draft));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        placeholder="GCash ref, paid cash to…"
        className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500 dark:border-stone-800 dark:bg-stone-950"
      />
    </div>
  );
}
