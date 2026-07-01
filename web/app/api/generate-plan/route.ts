import { NextRequest, NextResponse } from "next/server";
import { generatePlanRequestSchema } from "@/lib/types";
import { generateActionPlan } from "@/lib/claude";
import { createServiceRoleClient } from "@/lib/supabase/server";

async function logAiCall(params: {
  success: boolean;
  usage?: { inputTokens: number; outputTokens: number };
  errorMessage?: string;
}) {
  try {
    const supabase = createServiceRoleClient();
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

    void logAiCall({ success: true, usage });

    return NextResponse.json({ recommendations: plan });
  } catch (error) {
    void logAiCall({
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "JiPange couldn't generate your plan right now. Please try again shortly." },
      { status: 500 }
    );
  }
}
