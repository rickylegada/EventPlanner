import { LogOut } from "lucide-react";
import { logoutAction } from "@/server/actions";

export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-200 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
      >
        <LogOut size={15} /> Sign out of this device
      </button>
    </form>
  );
}
