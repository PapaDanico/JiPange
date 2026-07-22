import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Supabase isn't provisioned yet — run in guest-only mode rather than 500ing every route.
  if (!isSupabaseConfigured()) {
    return response;
  }

  // A present-but-malformed Supabase URL/key throws synchronously from the
  // client constructor — catch it here too, so a bad env var degrades to
  // guest mode instead of 502ing every route on the site.
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            request.cookies.set({ name, value });
            response = NextResponse.next({ request });
            response.cookies.set(name, value, options);
          },
          remove(name: string, options: Record<string, unknown>) {
            request.cookies.set({ name, value: "" });
            response = NextResponse.next({ request });
            response.cookies.set(name, "", options);
          },
        },
      }
    );

    await supabase.auth.getUser();
  } catch {
    return NextResponse.next({ request });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
