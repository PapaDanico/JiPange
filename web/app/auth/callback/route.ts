import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Guard against open redirects: only allow relative internal paths.
  const rawNext = searchParams.get("next") ?? "/plan";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes(":")
      ? rawNext
      : "/plan";

  const supabase = createClient();
  if (code && supabase) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
