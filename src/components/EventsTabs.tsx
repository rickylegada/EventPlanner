"use client";

import { useState } from "react";

/**
 * Upcoming and Past as two tabs rather than one long scroll. Past events are
 * only interesting when you go looking for them — usually to chase money.
 */
export function EventsTabs({
  upcoming,
  past,
  pastCount,
  owedCount,
}: {
  upcoming: React.ReactNode;
  past: React.ReactNode;
  pastCount: number;
  owedCount: number;
}) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const button = (value: "upcoming" | "past", text: string, badge?: number) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === value}
      onClick={() => setTab(value)}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        tab === value
          ? "bg-white text-stone-900 shadow-sm dark:bg-stone-700 dark:text-stone-50"
          : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
      }`}
    >
      {text}
      {badge ? (
        <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );

  return (
    <div>
      <div
        role="tablist"
        className="mb-3 flex gap-1 rounded-xl bg-stone-200 p-1 dark:bg-stone-800"
      >
        {button("upcoming", "Events")}
        {button("past", `Past (${pastCount})`, owedCount)}
      </div>

      <div role="tabpanel">{tab === "upcoming" ? upcoming : past}</div>
    </div>
  );
}
