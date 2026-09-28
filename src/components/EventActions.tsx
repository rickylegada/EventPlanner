"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { repeatWeeklyAction } from "@/server/actions";

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
