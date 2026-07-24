import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Kids\' Education Savings Calculator — JiPange";

export default function Image() {
  return ogCard('Kids\' Education Savings Calculator');
}
