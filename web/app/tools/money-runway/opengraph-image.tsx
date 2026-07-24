import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Money Runway Calculator — JiPange";

export default function Image() {
  return ogCard('Money Runway Calculator');
}
