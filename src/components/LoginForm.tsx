"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/server/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60"
    >
      {pending ? "Checking…" : "Enter"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="space-y-3">
      <label htmlFor="passcode" className="sr-only">
        Group passcode
      </label>
      <input
        id="passcode"
        name="passcode"
        type="password"
        autoComplete="current-password"
        autoFocus
        placeholder="Group passcode"
        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-center tracking-widest outline-none placeholder:tracking-normal focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-stone-700 dark:bg-stone-900"
      />

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-center text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
          {state.error}
        </p>
      )}

      <SubmitButton />

      <p className="pt-2 text-center text-xs text-stone-500 dark:text-stone-400">
        Ask the group chat for the code.
      </p>
    </form>
  );
}
