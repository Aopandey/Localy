import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;
export const workspaceId =
  process.env.NEXT_PUBLIC_SUPABASE_WORKSPACE_ID || "localy";
export function getSupabaseConfigError(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    return "Supabase connection is not configured. Add the project URL and publishable key to .env.local.";
  try {
    if (new URL(url).protocol !== "https:")
      return "The Supabase project URL must use HTTPS.";
  } catch {
    return "The Supabase project URL is invalid.";
  }
  // Secret keys bypass RLS. Reject them before anything is sent from this browser.
  if (!key.startsWith("sb_publishable_"))
    return "Use the publishable key (sb_publishable_…), not a secret or legacy key.";
  return null;
}
export function getSupabase(): SupabaseClient {
  const error = getSupabaseConfigError();
  if (error) throw new Error(error);
  if (!client)
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        global: {
          fetch: (input, init) =>
            fetch(input, {
              ...init,
              signal: init?.signal ?? AbortSignal.timeout(15000),
            }),
        },
      },
    );
  return client;
}
