"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ListChecks, Plus, Users } from "lucide-react";

const tabs = [
  { href: "/", label: "Events", icon: ListChecks },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/players", label: "Players", icon: Users },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-stone-900/95">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                active
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              {label}
            </Link>
          );
        })}

        <Link
          href="/events/new"
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-stone-500 transition hover:text-emerald-600 dark:text-stone-400 dark:hover:text-emerald-400"
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Plus size={14} strokeWidth={3} />
          </span>
          New
        </Link>
      </div>
    </nav>
  );
}
