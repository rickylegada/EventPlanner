"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { QR_SLOTS } from "@/lib/payments";
import { savePaymentDetailsAction, type PaymentState } from "@/server/actions";
import { QrUpload } from "@/components/QrUpload";

const field =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 dark:border-stone-700 dark:bg-stone-900";

const label =
  "block text-xs font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400";

function SaveButton({ saved }: { saved?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
    >
      {pending ? "Saving…" : saved ? "Saved" : "Save"}
    </button>
  );
}

/**
 * Everything to do with getting paid, in one place: the GCash number people
 * can copy, and the two QR images. The slots are fixed — GCash first, any
 * other bank second — so there is nothing to name.
 */
export function PaymentSection({
  eventId,
  gcashName,
  gcashNumber,
  signedUrls,
}: {
  eventId: string;
  gcashName: string;
  gcashNumber: string;
  signedUrls: Record<string, string | null>;
}) {
  const save = savePaymentDetailsAction.bind(null, eventId);
  const [state, formAction] = useActionState<PaymentState, FormData>(save, {});

  return (
    <section className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900/40">
      <div className="px-1">
        <h2 className="text-sm font-semibold">How people pay you</h2>
        <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
          Shown to everyone who still owes money. Add or change it any time.
        </p>
      </div>

      <form action={formAction} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="gcash_name">
              Account name
            </label>
            <input
              id="gcash_name"
              name="gcash_name"
              defaultValue={gcashName}
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
              defaultValue={gcashNumber}
              placeholder="0917 123 4567"
              className={`mt-1.5 ${field}`}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SaveButton saved={state.saved} />
          {state.error && (
            <p className="text-xs text-rose-700 dark:text-rose-400">{state.error}</p>
          )}
        </div>
      </form>

      <div className="grid grid-cols-2 gap-3 border-t border-stone-200 pt-3 dark:border-stone-800">
        {QR_SLOTS.map(({ slot, label: slotLabel }) => (
          <QrUpload
            key={slot}
            eventId={eventId}
            slot={slot}
            label={slotLabel}
            signedUrl={signedUrls[slot] ?? null}
          />
        ))}
      </div>
    </section>
  );
}
