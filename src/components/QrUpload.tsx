"use client";

import { useActionState, useRef, useTransition } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { ImageUp, Trash2 } from "lucide-react";
import { removeQrAction, uploadQrAction, type QrState } from "@/server/actions";

function Submitting({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
      {pending ? "Uploading…" : children}
    </span>
  );
}

/**
 * One QR slot: shows the current image if there is one, and a file picker that
 * uploads as soon as a file is chosen — no separate save step to forget.
 */
export function QrUpload({
  eventId,
  slot,
  label,
  signedUrl,
}: {
  eventId: string;
  slot: "one" | "two";
  label: string;
  signedUrl: string | null;
}) {
  const upload = uploadQrAction.bind(null, eventId, slot);
  const [state, formAction] = useActionState<QrState, FormData>(upload, {});
  const [removing, startRemoving] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="rounded-xl border border-stone-300 bg-white p-3 dark:border-stone-700 dark:bg-stone-900">
      <p className="mb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400">
        {label}
      </p>

      {signedUrl ? (
        <div className="space-y-2">
          <Image
            src={signedUrl}
            alt={`${label} payment QR code`}
            width={320}
            height={320}
            unoptimized
            className="mx-auto h-40 w-40 rounded-lg border border-stone-200 bg-white object-contain p-1 dark:border-stone-700"
          />
          <button
            type="button"
            disabled={removing}
            onClick={() => startRemoving(() => removeQrAction(eventId, slot))}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-300 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            <Trash2 size={13} /> {removing ? "Removing…" : "Remove"}
          </button>
        </div>
      ) : (
        <p className="mb-2 rounded-lg border border-dashed border-stone-300 px-3 py-6 text-center text-xs text-stone-500 dark:border-stone-700 dark:text-stone-400">
          No image yet
        </p>
      )}

      <form action={formAction} ref={formRef} className="mt-2">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium transition hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800">
          <ImageUp size={14} />
          <Submitting>{signedUrl ? "Replace image" : "Choose image"}</Submitting>
          <input
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={() => formRef.current?.requestSubmit()}
          />
        </label>
      </form>

      {state.error && (
        <p className="mt-2 text-xs text-rose-700 dark:text-rose-400">{state.error}</p>
      )}
    </div>
  );
}
