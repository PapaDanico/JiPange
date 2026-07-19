import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateNetPay } from "@/lib/tax";

const requestSchema = z.object({
  grossMonthlySalary: z.number().positive().finite().max(10_000_000),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const breakdown = calculateNetPay(parsed.data.grossMonthlySalary);
  return NextResponse.json(breakdown);
}
