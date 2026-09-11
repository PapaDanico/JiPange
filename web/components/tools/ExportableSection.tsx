"use client";

import { useRef } from "react";
import ExportCardButton from "./ExportCardButton";

/**
 * Holds the ref that ExportCardButton captures, so a SERVER-rendered page can
 * offer a working export.
 *
 * ExportCardButton needs a ref to the node it rasterises. The 21 calculators
 * that already export create that ref inside their own client component,
 * right next to the results they render — which is the better placement and
 * is left alone. This exists for the pages that have no such component to
 * hang it on: /plan, /picture and /money-map are server components around a
 * client view, and five tool pages render a widget that never grew an export
 * of its own.
 *
 * It replaces `window.print()`, which is what those pages offered before and
 * which CLAUDE.md forbids for a reason paid for in support: it is absent on
 * iOS when the app runs from the home screen and dropped silently by several
 * Android WebViews, so on the devices most of these readers use the button
 * did nothing at all. This path builds the file in the page and downloads it.
 *
 * WHAT GETS CAPTURED, AND WHY IT INCLUDES THE FIELDS
 *
 * This wraps the whole section, inputs and all, rather than a results-only
 * node — the calculators that wire their own ExportCardButton point it at
 * their results and pass `assumptions` separately, which is tidier and needs
 * per-widget knowledge this wrapper does not have. Capturing the filled-in
 * fields gets to the same place by a blunter route: the figure and the
 * figures it came from travel together in one file, which is the property
 * that matters when a sheet is carried to a bursar or a SACCO. A cleaner
 * sheet that cannot say what it assumed would be the worse trade. None of
 * these sections use range sliders, which are the controls that rasterise
 * badly; they are text and number fields, and their values render.
 *
 * The print STYLESHEET is deliberately untouched. `@media print` in
 * globals.css and PrintLetterhead still typeset a proper letterheaded report
 * for a reader who prints from the browser's own menu, which works; it was
 * only the in-page button that was broken.
 */
export default function ExportableSection({
  filename,
  title,
  notes,
  orientation,
  children,
}: {
  filename: string;
  title?: string;
  notes?: string[];
  orientation?: "portrait" | "landscape";
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <>
      <div ref={ref}>{children}</div>
      <ExportCardButton
        containerRef={ref}
        filename={filename}
        title={title}
        notes={notes}
        orientation={orientation}
      />
    </>
  );
}
