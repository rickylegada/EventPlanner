"use client";

import { useState } from "react";

export function EventTabs({
  initial,
  rsvpPanel,
  moneyPanel,
  moneyLabel,
}: {
  initial: "rsvp" | "money";
  rsvpPanel: React.ReactNode;
  moneyPanel: React.ReactNode;
  moneyLabel: string;
}) {
  const [tab, setTab] = useState(initial);

  const button = (value: "rsvp" | "money", label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === value}
      onClick={() => setTab(value)}
      className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        tab === value
          ? "bg-white text-stone-900 shadow-sm dark:bg-stone-700 dark:text-stone-50"
          : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div
        role="tablist"
        className="mb-3 flex gap-1 rounded-xl bg-stone-200 p-1 dark:bg-stone-800"
      >
        {button("rsvp", "Who's coming")}
        {button("money", moneyLabel)}
      </div>

      <div role="tabpanel">{tab === "rsvp" ? rsvpPanel : moneyPanel}</div>
    </div>
  );
}
