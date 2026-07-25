import Link from "next/link";
import { CALCULATOR_GROUPS } from "@/lib/tool-groups";

export default function CalculatorsDropdownPanel() {
  return (
    <div className="max-h-[70vh] overflow-y-auto">
      {CALCULATOR_GROUPS.map((group) => (
        <div key={group.label} className="px-2 py-1.5">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
            {group.label}
          </p>
          {group.calculators.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-ink-soft hover:bg-canvas hover:text-primary"
            >
              <span aria-hidden="true">{tool.icon}</span>
              {tool.title}
            </Link>
          ))}
        </div>
      ))}
      <Link
        href="/tools"
        className="mt-1 block rounded-lg border-t border-border px-2 py-2 text-sm font-medium text-primary hover:bg-canvas"
      >
        See all calculators →
      </Link>
    </div>
  );
}
