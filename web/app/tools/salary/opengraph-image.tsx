import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Salary & Pay Hub — JiPange";

export default function Image() {
  return ogCard('Salary & Pay Hub');
}
