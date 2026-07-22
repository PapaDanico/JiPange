import { NextRequest, NextResponse } from "next/server";
import { generatePlanRequestSchema } from "@/lib/types";
import { generateActionPlan } from "@/lib/claude";
import { aiErrorResponse, logAiCall } from "@/lib/ai-route-helpers";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = generatePlanRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { profile, calculations } = parsed.data;

  try {
    await enforceRateLimit(request, "generate-plan");

    const { plan, usage } = await generateActionPlan({
      profile,
      net: calculations.netMonthly,
      surplus: calculations.savingsCapacity,
    });

    await logAiCall({ success: true, usage });

    return NextResponse.json({ recommendations: plan });
  } catch (error) {
    return aiErrorResponse("generate-plan", error);
  }
}
