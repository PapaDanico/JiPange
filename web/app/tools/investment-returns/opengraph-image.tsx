import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Investment Returns Calculator — JiPange";

export default function Image() {
  return ogCard('Investment Returns Calculator');
}
