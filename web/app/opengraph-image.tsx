import { ogAlt, ogCard, ogContentType, ogSize } from "@/lib/og/card";

// Site-wide fallback card: covers the homepage and every route without its
// own opengraph-image file (about, privacy, dashboard, …), replacing the
// legacy off-spec 1131×609 logo lockup so all unfurls share one system.
const title = "Your money is working hard. Just not for you.";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = ogAlt("JiPange");

export default function Image() {
  return ogCard(title);
}
