import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "./config";

/**
 * Returns null when Supabase isn't configured, or when the configured
 * URL/key is malformed — either way callers must handle the guest-mode case
 * rather than the whole route throwing.
 */
export async function createClient() {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  try {
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Called from a Server Component with no request context — safe to
              // ignore because middleware refreshes the session on navigation.
            }
          },
          remove(name: string, options: Record<string, unknown>) {
            try {
              cookieStore.set(name, "", options);
            } catch {
              // Same as above.
            }
          },
        },
      }
    );
  } catch {
    return null;
  }
}

/**
 * Service-role client for trusted server-side operations (e.g. logging ai_calls).
 * Returns null when Supabase isn't configured.
 */
export function createServiceRoleClient() {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  try {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  } catch {
    return null;
  }
}
