import { ogAlt, ogCard, ogContentType, ogSize } from "@/lib/og/card";

const title = "FIRE Number Calculator";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = ogAlt(title);

export default function Image() {
  return ogCard(title);
}
