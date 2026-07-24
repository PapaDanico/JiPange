import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "FIRE Number Calculator — JiPange";

export default function Image() {
  return ogCard('FIRE Number Calculator');
}
