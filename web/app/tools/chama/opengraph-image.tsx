import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Chama / Group savings optimizer — JiPange";

export default function Image() {
  return ogCard('Chama / Group savings optimizer');
}
