"use client";

import { useState, useTransition } from "react";
import { Check, CheckCheck, Pencil, UserPlus } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { formatPeso, type MoneySplit } from "@/lib/money";
import type { Participant, Rsvp } from "@/lib/types";
import {
  addParticipantAction,
  markGoingAsAttendedAction,
  setAttendedAction,
  setPaidAction,
  setPaidNoteAction,
  setShareOverrideAction,
} from "@/server/actions";

/** Shown next to anyone not yet ticked off, so the RSVP is not lost. */
const RSVP_HINT: Record<Rsvp, string> = {
  going: "said in",
  maybe: "maybe",
  out: "said out",
  no_reply: "",
};

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
  const here = participants.filter((p) => p.attended).length;

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

      {participants.length > 0 && (
        <div className="mb-2 flex items-baseline justify-between px-1">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Tap a name to mark them as here
          </p>
          <p className="text-xs font-medium tabular-nums text-stone-500 dark:text-stone-400">
            {here} of {participants.length}
          </p>
        </div>
      )}

      {pendingGoing.length > 0 && (
        <button
          type="button"
          onClick={() => startTransition(() => markGoingAsAttendedAction(eventId))}
          className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <CheckCheck size={16} />
          Mark the {pendingGoing.length} who said they are in
        </button>
      )}

      {participants.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
          Nobody on this event yet. Add whoever turned up below.
        </p>
      ) : (
        <ul className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900 dark:shadow-none">
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
  const settled = split.assigned > 0 && split.outstanding === 0;

  return (
    <div className="mb-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:shadow-none">
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold tabular-nums">
          {formatPeso(split.total)}
        </span>
        <span className="text-sm text-stone-500 dark:text-stone-400">
          {split.attendeeCount} {split.attendeeCount === 1 ? "person" : "people"} came
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-sm">
        <span className="tabular-nums text-stone-500 dark:text-stone-400">
          {formatPeso(split.collected)} collected
        </span>
        <span
          className={
            split.outstanding > 0
              ? "font-semibold tabular-nums text-amber-700 dark:text-amber-400"
              : "font-medium text-emerald-700 dark:text-emerald-400"
          }
        >
          {split.outstanding > 0
            ? `${formatPeso(split.outstanding)} to go`
            : settled
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
  const [editingAmount, setEditingAmount] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const showMoney = p.attended && hasMoney;

  return (
    <li className={p.attended ? "" : "bg-stone-50/60 dark:bg-stone-950/30"}>
      <div className="flex items-center gap-2 px-2 py-1">
        {/* The name is the switch — a checkbox reads as "fill in a form". */}
        <button
          type="button"
          aria-pressed={p.attended}
          aria-label={
            p.attended
              ? `${p.player.name} came — tap to undo`
              : `Mark ${p.player.name} as here`
          }
          disabled={busy}
          onClick={() => run(() => setAttendedAction(eventId, p.id, !p.attended))}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 py-2 text-left transition active:bg-stone-100 dark:active:bg-stone-800"
        >
          {/* The tick rides on the avatar rather than taking its own column. */}
          <span className="relative shrink-0">
            <span className={p.attended ? "" : "opacity-40 grayscale"}>
              <Avatar name={p.player.name} color={p.player.color} />
            </span>
            {p.attended && (
              <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-600 text-white ring-2 ring-white dark:ring-stone-900">
                <Check size={10} strokeWidth={4} />
              </span>
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span
              className={`block truncate text-sm ${
                p.attended
                  ? "font-medium"
                  : "text-stone-400 dark:text-stone-500"
              }`}
            >
              {p.player.name}
              {isMe && (
                <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  you
                </span>
              )}
              {!p.attended && p.rsvp !== "no_reply" && (
                <span className="ml-1.5 text-[11px] font-normal text-stone-400 dark:text-stone-500">
                  {RSVP_HINT[p.rsvp]}
                </span>
              )}
            </span>

            {/* A saved note lives under the name as quiet text, not a box. */}
            {showMoney && p.paid && p.paid_note && !editingNote && (
              <span className="block truncate text-[11px] text-stone-400 dark:text-stone-500">
                {p.paid_note}
              </span>
            )}
          </span>
        </button>

        {showMoney && (
          <>
            <AmountCell
              eventId={eventId}
              rowId={p.id}
              share={share}
              isOverride={isOverride}
              paid={p.paid}
              editing={editingAmount}
              setEditing={setEditingAmount}
              run={run}
            />

            {/*
              Unpaid is the thing that needs chasing, so it is the loud one.
              Paid goes quiet — otherwise a settled event is a wall of green.
            */}
            <button
              type="button"
              disabled={busy}
              aria-label={
                p.paid
                  ? `${p.player.name} has paid — tap to undo`
                  : `Mark ${p.player.name} as paid`
              }
              onClick={() => run(() => setPaidAction(eventId, p.id, !p.paid))}
              className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition ${
                p.paid
                  ? "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-500 dark:hover:bg-emerald-950/40"
                  : "bg-amber-400 text-amber-950 hover:bg-amber-300"
              }`}
            >
              {p.paid ? <Check size={14} strokeWidth={3} /> : "Unpaid"}
            </button>

            {/*
              Notes are opt-in and cost no vertical space: a faint pencil on
              paid rows only. An empty input under every paid person turned a
              settled event into a wall of boxes.
            */}
            {p.paid && !editingNote && (
              <button
                type="button"
                aria-label={`${p.paid_note ? "Edit" : "Add"} a payment note for ${p.player.name}`}
                onClick={() => setEditingNote(true)}
                className="shrink-0 rounded-full p-1.5 text-stone-300 transition hover:bg-stone-100 hover:text-stone-600 dark:text-stone-600 dark:hover:bg-stone-800"
              >
                <Pencil size={12} />
              </button>
            )}
          </>
        )}
      </div>

      {showMoney && p.paid && (editingNote || p.paid_note) && (
        <NoteLine
          eventId={eventId}
          rowId={p.id}
          note={p.paid_note ?? ""}
          editing={editingNote}
          setEditing={setEditingNote}
          run={run}
        />
      )}
    </li>
  );
}

function AmountCell({
  eventId,
  rowId,
  share,
  isOverride,
  paid,
  editing,
  setEditing,
  run,
}: {
  eventId: string;
  rowId: string;
  share: number;
  isOverride: boolean;
  paid: boolean;
  editing: boolean;
  setEditing: (v: boolean) => void;
  run: (fn: () => void) => void;
}) {
  const [draft, setDraft] = useState("");

  if (editing) {
    return (
      <input
        autoFocus
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          run(() => setShareOverrideAction(eventId, rowId, draft));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setEditing(false);
        }}
        placeholder="auto"
        className="w-20 shrink-0 rounded-lg border border-emerald-500 bg-white px-2 py-1.5 text-right text-sm outline-none dark:bg-stone-900"
      />
    );
  }

  return (
    <button
      type="button"
      title="Tap to set a custom amount for this person"
      onClick={() => {
        setDraft(isOverride ? String(share) : "");
        setEditing(true);
      }}
      className={`shrink-0 rounded-lg px-1.5 py-1.5 text-sm tabular-nums transition hover:bg-stone-100 dark:hover:bg-stone-800 ${
        paid
          ? "text-stone-400 dark:text-stone-500"
          : "font-semibold text-stone-800 dark:text-stone-100"
      } ${isOverride ? "underline decoration-dotted underline-offset-4" : ""}`}
    >
      {formatPeso(share)}
    </button>
  );
}

function NoteLine({
  eventId,
  rowId,
  note,
  editing,
  setEditing,
  run,
}: {
  eventId: string;
  rowId: string;
  note: string;
  editing: boolean;
  setEditing: (v: boolean) => void;
  run: (fn: () => void) => void;
}) {
  const [draft, setDraft] = useState(note);

  if (editing) {
    return (
      <div className="px-3 pb-2 pl-12">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (draft !== note) run(() => setPaidNoteAction(eventId, rowId, draft));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setEditing(false);
          }}
          placeholder="GCash ref, paid cash to…"
          className="w-full rounded-lg border border-emerald-500 bg-white px-2.5 py-1.5 text-xs outline-none dark:bg-stone-900"
        />
      </div>
    );
  }

  // Not editing: the saved note already shows as quiet text under the name,
  // and the pencil beside the paid tick is how you get back in here.
  return null;
}
