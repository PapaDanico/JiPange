import { createServerClient } from "@supabase/ssr";
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

/*
 * createServiceRoleClient() was removed here.
 *
 * Its only caller was logAiCall(), which wrote to the ai_calls table for every
 * Claude API request. Both are gone — the plan is computed on the device now —
 * and with them the last reason this project had to hold a
 * SUPABASE_SERVICE_ROLE_KEY.
 *
 * That key bypasses row-level security entirely: it is the most privileged
 * credential a Supabase project issues. Leaving dead code that reads it is an
 * invitation to set it in the deployment "because the code expects it", and a
 * secret that exists only because nobody deleted the code around it is a
 * liability with no upside. The remaining Supabase paths are all user-scoped
 * through the anon key and RLS, which is what they should have been anyway.
 */
