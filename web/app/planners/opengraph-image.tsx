import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Goal Planners — JiPange";

export default function Image() {
  return ogCard('Goal Planners');
}
