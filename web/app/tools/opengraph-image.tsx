import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Free Financial Calculators — JiPange";

export default function Image() {
  return ogCard('Free Financial Calculators');
}
