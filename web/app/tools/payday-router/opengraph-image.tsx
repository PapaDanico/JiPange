import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "📱 The M-Pesa Payday Safety Router — JiPange";

export default function Image() {
  return ogCard('📱 The M-Pesa Payday Safety Router');
}
