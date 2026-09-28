"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, ClipboardCheck, ClipboardCopy } from "lucide-react";
import { repeatWeeklyAction } from "@/server/actions";

/**
 * Copies the pasteable group-chat summary. If the clipboard API is blocked
 * (some in-app browsers do that) the text is shown in a box to copy by hand,
 * rather than the button silently doing nothing.
 */
export function CopySummaryButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");

  useEffect(() => {
    if (state !== "copied") return;
    const t = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(t);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("manual");
    }
  }

  return (
    <div className="flex-1">
      <button
        type="button"
        onClick={copy}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm font-medium transition hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800"
      >
        {state === "copied" ? (
          <>
            <ClipboardCheck size={15} className="text-emerald-600" /> Copied
          </>
        ) : (
          <>
            <ClipboardCopy size={15} /> Copy summary
          </>
        )}
      </button>

      {state === "manual" && (
        <textarea
          readOnly
          value={text}
          rows={8}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-2 w-full rounded-xl border border-stone-300 bg-white p-2 font-mono text-xs dark:border-stone-700 dark:bg-stone-900"
        />
      )}
    </div>
  );
}

export function RepeatWeeklyButton({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => repeatWeeklyAction(eventId))}
      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm font-medium transition hover:bg-stone-100 disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800"
    >
      <CalendarPlus size={15} />
      {pending ? "Copying…" : "Repeat next week"}
    </button>
  );
}

/**
 * Keeps the page honest when several people are tapping at once: re-fetches
 * whenever the tab regains focus, and every 20s while it is visible.
 */
export function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };

    const timer = setInterval(refresh, seconds * 1000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router, seconds]);

  return null;
}
