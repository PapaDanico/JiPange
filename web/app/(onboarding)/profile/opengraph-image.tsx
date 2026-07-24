import { ogAlt, ogCard, ogContentType, ogSize } from "@/lib/og/card";

const title = "Your 90-second money check";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = ogAlt(title);

export default function Image() {
  return ogCard(title);
}
