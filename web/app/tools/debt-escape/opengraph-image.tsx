import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Debt Stack Buster — JiPange";

export default function Image() {
  return ogCard('Debt Stack Buster');
}
