import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import {
  actionPlanSchema,
  goalStrategySchema,
  type ActionPlan,
  type GoalStrategy,
  type GoalStrategyRequest,
  type Profile,
} from "./types";

/**
 * Haiku rather than Sonnet: these routes run inside Netlify Functions with a
 * ~10-second synchronous execution cap, and Sonnet routinely needs 12-20s to
 * emit a full plan. Haiku finishes the same JSON in ~3-5s, which leaves room
 * for one parse-retry inside the budget.
 */
const CLAUDE_MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 800;

/**
 * Per-request budget, in ms. The Netlify kill at ~10s surfaces to the client
 * as an opaque 502, so we abort ourselves first and return a real error.
 */
const REQUEST_TIMEOUT_MS = 8_000;

/** The server has no ANTHROPIC_API_KEY configured at all. */
export class AiNotConfiguredError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set");
    this.name = "AiNotConfiguredError";
  }
}

/** The configured key was rejected by the API (revoked, disabled, or mistyped). */
export class AiAuthError extends Error {
  constructor() {
    super("Anthropic API rejected the configured API key");
    this.name = "AiAuthError";
  }
}

const JIPANGE_VOICE = `You are JiPange, a friendly and direct Kenyan financial advisor. You speak plain, warm English with occasional Swahili where natural (e.g., "pesa", "harambee", "chama"). You understand how Kenyans actually manage money.`;

const HONESTY_RULE = `Never invent financial products, interest rates, or institutions that do not exist. If you are unsure of a current rate, tell the user to check current rates at the relevant institution instead of stating a specific number.`;

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
}

/**
 * Sends the prompt and parses the reply against `schema`. Retries exactly
 * once (at temperature 0) and only for malformed-JSON replies — API errors
 * won't be cured by an identical immediate retry, so they surface instead of
 * doubling the request time and risking the platform kill.
 */
async function generateJson<Schema extends z.ZodTypeAny>(
  prompt: string,
  schema: Schema
): Promise<{ result: z.infer<Schema>; usage: AiUsage }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiNotConfiguredError();
  }

  // maxRetries: 0 — the SDK's default of 2 internal retries can triple the
  // wall-clock time on a slow failure, blowing the Netlify execution cap.
  const client = new Anthropic({ maxRetries: 0, timeout: REQUEST_TIMEOUT_MS });

  const attempt = async (temperature?: number) => {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      ...(temperature !== undefined ? { temperature } : {}),
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text content in Claude response");
    }

    return {
      result: schema.parse(JSON.parse(extractJson(textBlock.text))) as z.infer<Schema>,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  };

  const mapApiError = (error: unknown): unknown =>
    error instanceof Anthropic.APIError && (error.status === 401 || error.status === 403)
      ? new AiAuthError()
      : error;

  try {
    return await attempt();
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw mapApiError(error);
    }
    try {
      return await attempt(0);
    } catch (retryError) {
      throw mapApiError(retryError);
    }
  }
}

// ── 3-step action plan (onboarding Screen 3) ──

function buildPlanPrompt(params: { profile: Profile; net: number; surplus: number }): string {
  const { profile, net, surplus } = params;

  return `${JIPANGE_VOICE}

Based on this person's profile:
- Name: ${profile.fullName}
- Age: ${profile.age}
- County: ${profile.county}
- Monthly gross salary: KES ${profile.grossMonthlySalary}
- Monthly net salary: KES ${Math.round(net)}
- Estimated monthly savings capacity: KES ${Math.round(surplus)}
- Number of dependants: ${profile.dependants}
- Chama/SACCO member: ${profile.chamaMember ? "Yes" : "No"}

Generate exactly 3 specific, ranked, immediately actionable financial recommendations for this person. Each recommendation must:
1. Be specific to their income level and life situation (not generic)
2. Reference actual Kenyan financial products or institutions where relevant (M-Shwari, specific SACCO types, NSE, HELB, Britam, NSSF Tier 2 voluntary, T-Bills via CBK DhowCSD, etc.)
3. Include a specific KES amount or percentage target
4. Be achievable within 90 days
5. Be ranked by impact (highest impact first)

${HONESTY_RULE}

Format as JSON:
[
  {
    "rank": 1,
    "title": "Short action title",
    "description": "2-3 sentence specific recommendation with KES amounts",
    "impact": "What this achieves in 12 months",
    "effort": "low|medium|high",
    "category": "savings|debt|insurance|investment|tax"
  }
]

Return only valid JSON. No preamble, no markdown fences.`;
}

export interface GeneratePlanResult {
  plan: ActionPlan;
  usage: AiUsage;
}

export async function generateActionPlan(params: {
  profile: Profile;
  net: number;
  surplus: number;
}): Promise<GeneratePlanResult> {
  const { result, usage } = await generateJson(buildPlanPrompt(params), actionPlanSchema);
  return { plan: result, usage };
}

// ── Goal strategy (reverse-engineered goal → Kenyan product strategy) ──

const GOAL_CONTEXT: Record<GoalStrategyRequest["goalType"], string> = {
  education:
    "The goal is funding a child's education (school fees / university costs under Kenya's CBC system).",
  home: "The goal is a deposit on a home or plot of land.",
  emergency:
    "The goal is an emergency fund — money that must stay liquid and instantly accessible, so capital preservation beats returns.",
  business: "The goal is seed capital for a small business (biashara).",
};

function buildGoalStrategyPrompt(request: GoalStrategyRequest): string {
  const feasibilityNote =
    request.feasibility === "beyond-reach"
      ? `IMPORTANT: The required amount EXCEEDS their monthly capacity. Your steps must address this honestly — suggest starting with what they can afford, extending the timeline, or a staged approach. Do not pretend the gap doesn't exist.`
      : request.feasibility === "unknown"
        ? "Their monthly savings capacity is unknown."
        : `This requires roughly ${Math.round((request.requiredMonthly / (request.monthlyCapacity ?? request.requiredMonthly)) * 100)}% of their monthly savings capacity (${request.feasibility}).`;

  return `${JIPANGE_VOICE}

${GOAL_CONTEXT[request.goalType]}

The numbers (already computed — do not recompute them):
- Goal: ${request.goalTitle}
- Target: KES ${Math.round(request.targetAmount)} needed in ${request.years} years
- Already saved: KES ${Math.round(request.currentSavings)}
- Required monthly saving to hit the target: KES ${Math.round(request.requiredMonthly)}
${request.monthlyCapacity ? `- Their total monthly savings capacity: KES ${Math.round(request.monthlyCapacity)}` : ""}
- ${feasibilityNote}

Recommend WHERE to put this money in Kenya and HOW to start, tailored to this goal's time horizon and the need for ${request.goalType === "emergency" ? "instant liquidity" : "growth with acceptable risk"}. Reference only real Kenyan products and institutions (e.g. money market funds from CIC/Britam/Sanlam, M-Shwari Lock Savings, SACCO deposits, T-Bills/Bonds via CBK DhowCSD, education insurance policies). ${HONESTY_RULE}

Format as JSON:
{
  "vehicle": "The recommended savings vehicle(s), one short phrase",
  "why": "1-2 sentences: why this vehicle fits this goal's horizon and risk",
  "steps": [
    { "step": 1, "title": "Short action title", "description": "Concrete first move with KES amounts, doable this week" },
    { "step": 2, "title": "...", "description": "..." },
    { "step": 3, "title": "...", "description": "..." }
  ],
  "watchOut": "The single biggest mistake or risk to avoid with this goal, 1-2 sentences"
}

Return only valid JSON. No preamble, no markdown fences.`;
}

export interface GenerateGoalStrategyResult {
  strategy: GoalStrategy;
  usage: AiUsage;
}

export async function generateGoalStrategy(
  request: GoalStrategyRequest
): Promise<GenerateGoalStrategyResult> {
  const { result, usage } = await generateJson(
    buildGoalStrategyPrompt(request),
    goalStrategySchema
  );
  return { strategy: result, usage };
}
