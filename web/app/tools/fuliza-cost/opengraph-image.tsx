import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "What does Fuliza really cost? — JiPange";

export default function Image() {
  return ogCard('What does Fuliza really cost?');
}
