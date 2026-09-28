import { redirect } from "next/navigation";
import { isSignedIn } from "@/lib/auth";
import { missingEnv } from "@/lib/config";
import { LoginForm } from "@/components/LoginForm";
import { SetupNotice } from "@/components/SetupNotice";

// Reads cookies and env at request time, so it must never be prerendered.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const missing = missingEnv();
  if (missing.length === 0 && (await isSignedIn())) redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mb-3 text-5xl">🏓</div>
        <h1 className="text-2xl font-bold tracking-tight">Pickle</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Who is playing, who came, and who still owes for the court.
        </p>
      </div>

      {missing.length > 0 ? <SetupNotice missing={missing} /> : <LoginForm />}
    </main>
  );
}
