import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "SHA Health Coverage Gap — JiPange";

export default function Image() {
  return ogCard('SHA Health Coverage Gap');
}
