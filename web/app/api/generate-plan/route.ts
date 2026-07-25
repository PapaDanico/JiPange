import { NextRequest, NextResponse } from "next/server";
import { generatePlanRequestSchema } from "@/lib/types";
import { generateActionPlan } from "@/lib/claude";
import { aiErrorResponse, logAiCall } from "@/lib/ai-route-helpers";
import { enforceRateLimit } from "@/lib/rate-limit";
import { aiCacheKey, getCachedAi, putCachedAi } from "@/lib/ai-cache";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = generatePlanRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { profile, calculations } = parsed.data;

  // Only the fields the plan is actually generated from, so an unrelated change
  // elsewhere in the payload does not needlessly miss the cache.
  const cacheInput = {
    profile,
    net: calculations.netMonthly,
    surplus: calculations.savingsCapacity,
  };
  const key = aiCacheKey("generate-plan", cacheInput);

  // Checked BEFORE the rate limiter on purpose: a cache hit costs no tokens, so
  // it should not consume the caller's ten-an-hour allowance. Someone stepping
  // back and forth through onboarding is not abusing anything.
  const cached = await getCachedAi<Awaited<ReturnType<typeof generateActionPlan>>["plan"]>(key);
  if (cached) {
    return NextResponse.json({ recommendations: cached });
  }

  try {
    await enforceRateLimit(request, "generate-plan");

    const { plan, usage } = await generateActionPlan(cacheInput);

    await logAiCall({ success: true, usage });
    await putCachedAi(key, plan);

    return NextResponse.json({ recommendations: plan });
  } catch (error) {
    return aiErrorResponse("generate-plan", error);
  }
}
