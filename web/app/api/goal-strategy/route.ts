import { NextRequest, NextResponse } from "next/server";
import { goalStrategyRequestSchema } from "@/lib/types";
import { generateGoalStrategy } from "@/lib/claude";
import { aiErrorResponse, logAiCall } from "@/lib/ai-route-helpers";
import { enforceRateLimit } from "@/lib/rate-limit";
import { aiCacheKey, getCachedAi, putCachedAi } from "@/lib/ai-cache";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = goalStrategyRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const key = aiCacheKey("goal-strategy", parsed.data);

  // Before the rate limiter: a cache hit costs nothing, so it must not spend
  // the caller's hourly allowance.
  const cached = await getCachedAi<Awaited<ReturnType<typeof generateGoalStrategy>>["strategy"]>(key);
  if (cached) {
    return NextResponse.json({ strategy: cached });
  }

  try {
    await enforceRateLimit(request, "goal-strategy");

    const { strategy, usage } = await generateGoalStrategy(parsed.data);

    await logAiCall({ success: true, usage });
    await putCachedAi(key, strategy);

    return NextResponse.json({ strategy });
  } catch (error) {
    return aiErrorResponse("goal-strategy", error);
  }
}
