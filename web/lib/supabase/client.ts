import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "./config";

export { isSupabaseConfigured };

/**
 * Returns null when Supabase isn't configured, so the app can keep running in
 * guest-only (localStorage) mode instead of throwing during render.
 */
export function createClient() {
  if (!isSupabaseConfigured()) return null;

  try {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  } catch {
    return null;
  }
}
