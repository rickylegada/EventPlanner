import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The one and only database client. It uses the service_role key, which
 * bypasses Row Level Security — so this module must never be imported from a
 * client component. Every page and action that touches data is a Server
 * Component or a Server Action, so the key stays on the server.
 */
let client: SupabaseClient | null = null;

/**
 * The Supabase dashboard shows several URLs and it is easy to copy the full
 * REST endpoint instead of the plain project URL. supabase-js adds `/rest/v1`
 * itself, so a pasted `.../rest/v1/` would produce `/rest/v1/rest/v1/players`
 * and the API answers "Invalid path specified in request URL". Trim it here
 * rather than making everyone get the value exactly right in two places.
 */
function normalizeProjectUrl(raw: string): string {
  return raw
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "")
    .replace(/\/+$/, "");
}

export function db(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and fill in " +
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from your Supabase project " +
        "(Settings -> Data API / API Keys), then restart `npm run dev`.",
    );
  }

  client = createClient(normalizeProjectUrl(url), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/** Supabase returns { data, error }; this turns an error into a real throw. */
export function unwrap<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
