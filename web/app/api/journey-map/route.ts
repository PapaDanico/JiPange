import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { mapJourney } from "@/lib/journey";

const journeyAnswersSchema = z.object({
  primary_goal: z.enum([
    "home_deposit",
    "education",
    "emergency_fund",
    "business_capital",
    "clear_debt",
  ]),
  income_bracket: z.enum(["under_50k", "50k_120k", "120k_250k", "above_250k"]),
  liquidity_leak: z.enum(["mobile_loans", "credit_card", "friends_family", "active_savings"]),
  current_vehicle: z
    .array(z.enum(["mpesa_bank", "mmf", "sacco", "chama", "none"]))
    .min(1)
    .max(5),
  timeline: z.enum(["short_term", "mid_term", "long_term"]),
});

/**
 * The backend mapping engine: answers in, dashboard model out. Deterministic,
 * stateless, and stores nothing — the privacy banner's promise holds.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = journeyAnswersSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  return NextResponse.json({ dashboard: mapJourney(parsed.data) });
}
