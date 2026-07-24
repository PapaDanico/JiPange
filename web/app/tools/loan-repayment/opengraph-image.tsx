import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Loan / HELB Repayment Calculator — JiPange";

export default function Image() {
  return ogCard('Loan / HELB Repayment Calculator');
}
