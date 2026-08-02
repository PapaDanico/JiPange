"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDownIcon } from "./NavIcons";

/**
 * Header nav disclosure: a button that reveals a panel of links below it.
 * Deliberately not role="menu"/"menuitem" — that ARIA pattern implies
 * arrow-key roving-tabindex menu behavior meant for action menus, and is a
 * common misuse for what's really just a collapsible list of navigation
 * links (see the ARIA APG's "Disclosure Navigation Menu" pattern). Plain
 * links inside a labelled, conditionally-rendered panel are simpler, robust
 * with screen readers, and need no custom keyboard model beyond Escape.
 */
export default function NavDropdown({
  label,
  active,
  children,
}: {
  label: string;
  active?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        /* Mwangaza's nav pattern: a pill, not an underline.
         *
         * The two products are already palette cousins — warm ground, amber
         * accent — and read as unrelated only because their headers are built
         * differently. An underline says "link"; the filled pill says "you are
         * here" at a glance and is what Mwangaza uses on every page.
         *
         * min-h-11 is the tap target. The bare text button was 20px tall on a
         * phone, well under the 44px floor, and sat beside a 36px pill CTA —
         * so the least reversible control was the easiest to hit and the
         * navigation was the hardest. */
        className={`inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          active
            ? "bg-ink text-background"
            : "text-muted hover:bg-canvas hover:text-ink"
        }`}
      >
        {label}
        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute left-1/2 top-full z-50 mt-3 w-80 -translate-x-1/2 rounded-2xl border border-border bg-white p-2 shadow-lg"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}
