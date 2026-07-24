import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Take-Home Pay Calculator — JiPange";

export default function Image() {
  return ogCard('Take-Home Pay Calculator');
}
