import Anthropic from "@anthropic-ai/sdk";
import { actionPlanSchema, type ActionPlan, type Profile } from "./types";

/** Pinned per the JiPange product spec; still an active model as of writing. */
const CLAUDE_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 800;

function buildPrompt(params: { profile: Profile; net: number; surplus: number }): string {
  const { profile, net, surplus } = params;

  return `You are JiPange, a friendly and direct Kenyan financial advisor. You speak plain, warm English with occasional Swahili where natural (e.g., "pesa", "harambee", "chama"). You understand how Kenyans actually manage money.

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

Never invent financial products, interest rates, or institutions that do not exist. If you are unsure of a current rate, tell the user to check current rates at the relevant institution instead of stating a specific number.

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

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

export interface GeneratePlanResult {
  plan: ActionPlan;
  usage: { inputTokens: number; outputTokens: number };
}

export async function generateActionPlan(params: {
  profile: Profile;
  net: number;
  surplus: number;
}): Promise<GeneratePlanResult> {
  const client = new Anthropic();
  const prompt = buildPrompt(params);

  const attempt = async (temperature?: number): Promise<GeneratePlanResult> => {
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

    const plan = actionPlanSchema.parse(JSON.parse(extractJson(textBlock.text)));

    return {
      plan,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  };

  try {
    return await attempt();
  } catch {
    // Retry once with temperature 0 to reduce the chance of a repeat parse failure.
    return await attempt(0);
  }
}
