import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "My Action Plan — JiPange";

export default function Image() {
  return ogCard('My Action Plan');
}
