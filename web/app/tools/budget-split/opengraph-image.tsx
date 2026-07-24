import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "50/25/25 Budget Split Calculator — JiPange";

export default function Image() {
  return ogCard('50/25/25 Budget Split Calculator');
}
