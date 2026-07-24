import { ogAlt, ogCard, ogContentType, ogSize } from "@/lib/og/card";

const title = "Are your deductions legal?";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = ogAlt(title);

export default function Image() {
  return ogCard(title);
}
