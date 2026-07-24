import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "SACCO or bank? Find the cheaper loan — JiPange";

export default function Image() {
  return ogCard('SACCO or bank? Find the cheaper loan');
}
