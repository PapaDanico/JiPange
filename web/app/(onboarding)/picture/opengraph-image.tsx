import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "My Pesa Picture — JiPange";

export default function Image() {
  return ogCard('My Pesa Picture');
}
