"use client";

import { useEffect, useState } from "react";
import { Check, Share2 } from "lucide-react";

/**
 * On a phone this opens the real share sheet, so the event goes straight to
 * Messenger or Viber in one tap. On a desktop browser, or if the person
 * dismisses the sheet, it falls back to copying the text.
 */
export function ShareButton({
  text,
  title,
  className = "",
}: {
  text: string;
  title: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 2000);
    return () => clearTimeout(t);
  }, [done]);

  async function share(e: React.MouseEvent) {
    // The card behind this button is a link; sharing should not open it.
    e.preventDefault();
    e.stopPropagation();

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text });
        return;
      } catch {
        // Dismissed, or the browser refused — fall through to copying.
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
    } catch {
      /* Nothing sensible left to try; the event page still shows everything. */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={`Share ${title}`}
      title={`Share ${title}`}
      className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 active:scale-95 dark:hover:bg-stone-800 dark:hover:text-stone-200 ${className}`}
    >
      {done ? (
        <Check size={16} className="text-emerald-600" />
      ) : (
        <Share2 size={16} />
      )}
    </button>
  );
}
