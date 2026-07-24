import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "20th-to-20th Savings Challenge — JiPange";

export default function Image() {
  return ogCard('20th-to-20th Savings Challenge');
}
