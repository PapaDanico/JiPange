import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "What is your salary really worth? — JiPange";

export default function Image() {
  return ogCard('What is your salary really worth?');
}
