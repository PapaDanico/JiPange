import { z } from "zod";
import { KENYA_COUNTIES } from "./counties";

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  age: z.number().int().min(18, "Must be 18 or older").max(80, "Must be 80 or younger"),
  county: z.enum([...KENYA_COUNTIES] as [string, ...string[]]),
  grossMonthlySalary: z.number().positive("Salary must be greater than zero"),
  dependants: z.number().int().min(0),
  chamaMember: z.boolean(),
});

export type Profile = z.infer<typeof profileSchema>;

export interface BudgetSplit {
  needs: number;
  socialObligations: number;
  wants: number;
  savings: number;
}

export interface Calculations {
  netMonthly: number;
  budgetSplit: BudgetSplit;
  savingsCapacity: number;
  savingsRate: number;
}

export const actionPlanItemSchema = z.object({
  rank: z.number().int().min(1).max(3),
  title: z.string().min(1),
  description: z.string().min(1),
  impact: z.string().min(1),
  effort: z.enum(["low", "medium", "high"]),
  category: z.enum(["savings", "debt", "insurance", "investment", "tax"]),
});

export const actionPlanSchema = z.array(actionPlanItemSchema).length(3);

export type ActionPlanItem = z.infer<typeof actionPlanItemSchema>;
export type ActionPlan = z.infer<typeof actionPlanSchema>;

export const generatePlanRequestSchema = z.object({
  profile: profileSchema,
  calculations: z.object({
    netMonthly: z.number(),
    savingsCapacity: z.number(),
  }),
});
