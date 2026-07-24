import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "True Cost of Buying Land in Kenya — JiPange";

export default function Image() {
  return ogCard('True Cost of Buying Land in Kenya');
}
