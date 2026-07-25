import Link from "next/link";
import { PLANNER_NAV_ITEMS } from "@/lib/planner-nav";

export default function PlannersDropdownPanel() {
  return (
    <div className="px-1 py-1">
      {PLANNER_NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-start gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-canvas"
        >
          <span className="text-base" aria-hidden="true">
            {item.icon}
          </span>
          <span>
            <span className="block font-medium text-primary">{item.title}</span>
            <span className="block text-xs text-ink-soft">{item.tagline}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
