import { NextRequest, NextResponse } from "next/server";
import { generatePlanRequestSchema } from "@/lib/types";
import { AiAuthError, AiNotConfiguredError, generateActionPlan } from "@/lib/claude";
import { createServiceRoleClient } from "@/lib/supabase/server";

async function logAiCall(params: {
  success: boolean;
  usage?: { inputTokens: number; outputTokens: number };
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

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = generatePlanRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { profile, calculations } = parsed.data;

  try {
    const { plan, usage } = await generateActionPlan({
      profile,
      net: calculations.netMonthly,
      surplus: calculations.savingsCapacity,
    });

    await logAiCall({ success: true, usage });

    return NextResponse.json({ recommendations: plan });
  } catch (error) {
    // Supabase logging is a no-op unless SUPABASE_SERVICE_ROLE_KEY is set, so
    // always emit to the function log too — it's the only channel guaranteed
    // to be visible in the Netlify dashboard when this fails in production.
    console.error("generate-plan failed:", error);

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
}
