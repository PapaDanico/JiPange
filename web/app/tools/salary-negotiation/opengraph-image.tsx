import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "What gross should I ask for? — JiPange";

export default function Image() {
  return ogCard('What gross should I ask for?');
}
