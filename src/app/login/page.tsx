import { redirect } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/PickleballSweatshow.png";
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
        <Image
          src={logo}
          alt="Pickleball Sweatshow"
          width={160}
          height={160}
          priority
          className="mx-auto size-36 object-contain"
        />
        <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
          Who is playing, who came, and who still owes for the court.
        </p>
      </div>

      {missing.length > 0 ? <SetupNotice missing={missing} /> : <LoginForm />}
    </main>
  );
}
