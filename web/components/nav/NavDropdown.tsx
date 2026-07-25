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
        className={`flex items-center gap-1 text-sm font-medium ${
          active ? "text-primary underline underline-offset-4" : "text-ink-soft hover:text-primary"
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
