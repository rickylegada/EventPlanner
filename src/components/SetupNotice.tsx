/**
 * Shown instead of the login box when .env.local has not been filled in yet,
 * so the very first run explains itself rather than throwing a stack trace.
 */
export function SetupNotice({ missing }: { missing: string[] }) {
  return (
    <div className="space-y-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
      <p className="font-semibold">Almost there — one setup step left.</p>
      <p>
        Copy <code className="rounded bg-amber-200/60 px-1 dark:bg-amber-900">.env.example</code> to{" "}
        <code className="rounded bg-amber-200/60 px-1 dark:bg-amber-900">.env.local</code> and fill
        in these values, then restart the dev server:
      </p>
      <ul className="list-inside list-disc font-mono text-xs">
        {missing.map((key) => (
          <li key={key}>{key}</li>
        ))}
      </ul>
      <p className="text-xs">
        The README in the project folder walks through where each one comes from.
      </p>
    </div>
  );
}
