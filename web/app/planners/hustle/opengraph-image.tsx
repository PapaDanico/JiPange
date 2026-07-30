import { ogAlt, ogCard, ogContentType, ogSize } from "@/lib/og/card";
import { PLANNER_NAV_ITEMS } from "@/lib/planner-nav";

/* The share card is the first thing a stranger sees, and it was advertising a
 * different product than the page it links to. Read the name, do not retype it. */
const title = PLANNER_NAV_ITEMS.find((item) => item.href === "/planners/hustle")!.title;

export const size = ogSize;
export const contentType = ogContentType;
export const alt = ogAlt(title);

export default function Image() {
  return ogCard(title);
}
