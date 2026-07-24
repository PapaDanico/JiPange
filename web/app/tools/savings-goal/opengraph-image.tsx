import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Savings Goal Calculator — JiPange";

export default function Image() {
  return ogCard('Savings Goal Calculator');
}
