"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Copy, QrCode } from "lucide-react";

export type PayOption = { label: string; url: string };

/**
 * What a player needs in order to actually send the money: the number to copy
 * and the QR codes to scan. Collapsed by default so it does not push the
 * attendance list down the screen.
 */
export function PayWith({
  gcashName,
  gcashNumber,
  options,
}: {
  gcashName: string | null;
  gcashNumber: string | null;
  options: PayOption[];
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!gcashNumber && options.length === 0) return null;

  async function copyNumber() {
    if (!gcashNumber) return;
    try {
      await navigator.clipboard.writeText(gcashNumber.replace(/\s+/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard blocked — the number is on screen to type manually. */
    }
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm font-semibold transition hover:bg-stone-50 dark:hover:bg-stone-800"
      >
        <QrCode size={16} className="shrink-0 text-emerald-600" />
        <span className="flex-1">How to pay</span>
        <span
          className={`text-stone-400 transition-transform ${open ? "rotate-90" : ""}`}
        >
          ›
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-stone-200 p-3 dark:border-stone-800">
          {gcashNumber && (
            <div className="flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-2.5 dark:bg-stone-800">
              <div className="min-w-0 flex-1">
                {gcashName && (
                  <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                    {gcashName}
                  </p>
                )}
                <p className="truncate font-semibold tabular-nums">{gcashNumber}</p>
              </div>
              <button
                type="button"
                onClick={copyNumber}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold transition hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-700"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-600" /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={13} /> Copy
                  </>
                )}
              </button>
            </div>
          )}

          {options.length > 0 && (
            <div className={options.length > 1 ? "grid grid-cols-2 gap-3" : ""}>
              {options.map((o) => (
                <figure key={o.label + o.url} className="text-center">
                  <Image
                    src={o.url}
                    alt={`${o.label} QR code`}
                    width={400}
                    height={400}
                    unoptimized
                    className="mx-auto w-full max-w-[200px] rounded-lg border border-stone-200 bg-white object-contain p-1.5 dark:border-stone-700"
                  />
                  <figcaption className="mt-1.5 text-xs font-medium text-stone-600 dark:text-stone-300">
                    {o.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          <p className="text-center text-xs text-stone-500 dark:text-stone-400">
            Paid already? Tap your own Unpaid button above so the organiser knows.
          </p>
        </div>
      )}
    </div>
  );
}
