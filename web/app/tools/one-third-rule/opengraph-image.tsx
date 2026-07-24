import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Are your deductions legal? — JiPange";

export default function Image() {
  return ogCard('Are your deductions legal?');
}
