import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/PickleballSweatshow.png";
import { redirect } from "next/navigation";
import { getCurrentPlayerId, requireSession } from "@/lib/auth";
import { missingEnv } from "@/lib/config";
import { getPlayers } from "@/server/data";
import { BottomNav } from "@/components/BottomNav";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (missingEnv().length > 0) redirect("/login");
  await requireSession();

  const [players, meId] = await Promise.all([getPlayers(), getCurrentPlayerId()]);
  const me = players.find((p) => p.id === meId) ?? null;

  return (
    <div className="mx-auto min-h-dvh max-w-lg">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-stone-100/90 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
        <Link
          href="/"
          className="-my-1 flex min-w-0 items-center gap-2 py-1 font-bold tracking-tight"
        >
          <Image
            src={logo}
            alt=""
            width={28}
            height={28}
            priority
            className="size-7 shrink-0 object-contain"
          />
          <span className="truncate text-sm">Pickleball Sweatshow</span>
        </Link>
        <Link
          href="/me"
          className="rounded-full border border-stone-300 px-3 py-2 text-xs font-medium text-stone-600 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-stone-700 dark:text-stone-300 dark:hover:text-emerald-400"
        >
          {me ? me.name : "Who are you?"}
        </Link>
      </header>

      <main className="px-4 pt-4 pb-28">{children}</main>

      <BottomNav />
    </div>
  );
}
