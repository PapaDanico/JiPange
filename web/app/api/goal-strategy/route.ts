import { NextRequest, NextResponse } from "next/server";
import { goalStrategyRequestSchema } from "@/lib/types";
import { generateGoalStrategy } from "@/lib/claude";
import { aiErrorResponse, logAiCall } from "@/lib/ai-route-helpers";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = goalStrategyRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await enforceRateLimit(request, "goal-strategy");

    const { strategy, usage } = await generateGoalStrategy(parsed.data);

    await logAiCall({ success: true, usage });

    return NextResponse.json({ strategy });
  } catch (error) {
    return aiErrorResponse("goal-strategy", error);
  }
}
