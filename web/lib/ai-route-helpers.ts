import { NextResponse } from "next/server";
import { AiAuthError, AiNotConfiguredError, type AiUsage } from "./claude";
import { createServiceRoleClient } from "./supabase/server";

export async function logAiCall(params: {
  success: boolean;
  usage?: AiUsage;
  errorMessage?: string;
}) {
  try {
    const supabase = createServiceRoleClient();
    if (!supabase) return;

    await supabase.from("ai_calls").insert({
      input_tokens: params.usage?.inputTokens ?? null,
      output_tokens: params.usage?.outputTokens ?? null,
      success: params.success,
      error_message: params.errorMessage ?? null,
    });
  } catch {
    // Logging must never break the user-facing request.
  }
}

/**
 * Maps an AI-generation failure to the response the client shows verbatim.
 * Also emits to the function log — Supabase logging is a no-op unless
 * SUPABASE_SERVICE_ROLE_KEY is set, so this is the only channel guaranteed
 * to be visible in the Netlify dashboard when production fails.
 */
export async function aiErrorResponse(routeName: string, error: unknown): Promise<NextResponse> {
  console.error(`${routeName} failed:`, error);

  await logAiCall({
    success: false,
    errorMessage: error instanceof Error ? error.message : "Unknown error",
  });

  if (error instanceof AiNotConfiguredError) {
    return NextResponse.json(
      { error: "AI planning isn't set up on the server yet (missing API key)." },
      { status: 503 }
    );
  }

  if (error instanceof AiAuthError) {
    return NextResponse.json(
      { error: "The server's AI credentials were rejected — the API key needs to be rotated." },
      { status: 502 }
    );
  }

  return NextResponse.json(
    { error: "JiPange couldn't generate your plan right now. Please try again shortly." },
    { status: 500 }
  );
}
