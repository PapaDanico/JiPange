/**
 * Builds the A4 document that gets exported, around the live result cards.
 *
 * WHAT WAS WRONG WITH THE OLD EXPORT
 * ----------------------------------
 * It rasterised the results `<div>` and framed it. That div is a phone layout:
 * full-width cards stacked vertically, each one mostly padding. Printed at A4
 * width the result was four stat cards filling an entire sheet, spilling onto
 * a second page — and because the band-pagination cut on a fixed pixel height,
 * that second page came out completely blank on both of the exports we looked
 * at. A blank page is what a reader sees before anything else.
 *
 * It also had no document furniture at all: no title, no date, no record of
 * the inputs, no note on method, no page number. A fee projection carried to a
 * school bursar or a SACCO cannot say what it assumed, which is the first
 * thing anyone competent asks.
 *
 * WHAT THIS DOES INSTEAD
 * ----------------------
 * The sister product already solved this — its bond reports are a branded
 * sheet with a header, a headline sentence, a stat row, a table and a
 * methodology footnote, and they fit one page. Rather than invent a second
 * house style, this builds the same skeleton for JiPange so the two products
 * produce recognisably related documents.
 *
 * ONE RENDERER, STILL
 * -------------------
 * The result cards are CLONED from the live DOM rather than re-rendered from
 * the numbers. That was a deliberate constraint of the original export and it
 * is kept: re-laying out the figures in PDF primitives means two renderers to
 * keep in step, and the printed number drifting from the on-screen one is
 * exactly the class of bug this codebase keeps finding. The document furniture
 * around the clone is new; the figures inside it are the ones on screen.
 *
 * The clone is re-flowed into a grid, which is the whole reason it now fits:
 * the same four cards that filled a sheet stacked sit comfortably in two
 * columns.
 */

/** A4 at 96dpi, in CSS pixels. */
export const A4_PORTRAIT = { w: 794, h: 1123 } as const;
export const A4_LANDSCAPE = { w: 1123, h: 794 } as const;

export interface SheetInput {
  /** Document title, e.g. "The Full Cost of Private School". */
  title: string;
  /** The live results node. Cloned, never moved. */
  body: HTMLElement;
  /** What the reader entered, so the sheet can be reproduced. */
  assumptions?: { label: string; value: string }[];
  /** Method and caveats, printed small at the foot. */
  notes?: string[];
  /** Force landscape. Otherwise chosen by fit. */
  orientation?: "portrait" | "landscape";
}

const BRAND = {
  ink: "#171717",
  inkSoft: "#4b4238",
  faint: "#6f6e69",
  border: "#e5e0d8",
  accent: "#e8a838",
  primary: "#6b5b4d",
  canvas: "#ffffff",
};

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** "26 July 2026" — the same long form the sister product's reports use. */
export function sheetDate(d: Date = new Date()): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * How far the body must shrink to fit the page, as a multiplier.
 *
 * Pulled out of buildSheet so the rule can be tested without a browser: this
 * is the decision that separates a complete one-page document from one whose
 * last paragraph is silently missing, and it was previously buried in a DOM
 * measurement nothing could exercise.
 *
 * No generous floor. A floor that stops short of what the content needs does
 * not protect legibility — it clips the bottom of the sheet, which is worse
 * than small type because the reader cannot tell anything is gone. 0.5 is a
 * backstop against a pathological input, not a design preference.
 */
export const MIN_FIT_SCALE = 0.5;

export function fitScale(contentHeight: number, availableHeight: number): number {
  if (!(availableHeight > 0) || !(contentHeight > 0)) return 1;
  if (contentHeight <= availableHeight) return 1;
  return Math.max(MIN_FIT_SCALE, availableHeight / contentHeight);
}

/**
 * Assembles the sheet off-screen and returns it, plus a disposer.
 *
 * Positioned far off-screen rather than `display:none`: html2canvas measures
 * the live element before painting its clone, and a hidden element measures
 * zero. This is the same lesson the card exporter already paid for once.
 */
export function buildSheet(input: SheetInput): { node: HTMLElement; dispose: () => void } {
  const landscape = input.orientation === "landscape";
  const page = landscape ? A4_LANDSCAPE : A4_PORTRAIT;

  const sheet = document.createElement("div");
  sheet.setAttribute("data-export-sheet", "");
  Object.assign(sheet.style, {
    position: "fixed",
    left: "-20000px",
    top: "0",
    width: `${page.w}px`,
    height: `${page.h}px`,
    overflow: "hidden",
    background: BRAND.canvas,
    color: BRAND.ink,
    padding: "40px 44px 32px",
    boxSizing: "border-box",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    display: "flex",
    flexDirection: "column",
  } as CSSStyleDeclaration);

  const assumptions = (input.assumptions ?? []).filter((a) => a.value?.trim());

  sheet.innerHTML = `
    <header style="display:flex;align-items:flex-start;justify-content:space-between;
                   border-bottom:2px solid ${BRAND.accent};padding-bottom:14px;">
      <div>
        <p style="margin:0;font-size:21px;font-weight:700;letter-spacing:-0.01em;color:${BRAND.ink};">
          Ji<span style="color:${BRAND.accent};">Pange</span>
        </p>
        <p style="margin:3px 0 0;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.faint};">
          Practical money tools for Kenya
        </p>
      </div>
      <div style="text-align:right;font-size:10px;color:${BRAND.faint};line-height:1.6;">
        <p style="margin:0;">${escape(input.title)}</p>
        <p style="margin:0;">${sheetDate()}</p>
      </div>
    </header>

    <h2 style="margin:20px 0 0;font-size:23px;font-weight:700;letter-spacing:-0.02em;color:${BRAND.ink};">
      ${escape(input.title)}
    </h2>

    ${
      assumptions.length
        ? `<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px 26px;
                       border-top:1px solid ${BRAND.border};border-bottom:1px solid ${BRAND.border};
                       padding:10px 0;">
             ${assumptions
               .map(
                 (a) => `<div>
                   <p style="margin:0;font-size:8.5px;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.faint};">${escape(a.label)}</p>
                   <p style="margin:2px 0 0;font-size:12px;font-weight:600;color:${BRAND.inkSoft};">${escape(a.value)}</p>
                 </div>`
               )
               .join("")}
           </div>`
        : ""
    }

    <!-- flex-basis 0 and min-height 0, not "auto".
         With flex:1 1 auto the slot GROWS to its content, so scrollHeight and
         clientHeight come out equal, the overflow check below reads zero, no
         scaling is applied — and the fixed-height sheet simply clips. That is
         exactly how a nine-row fee table lost its last four rows and the whole
         methodology footer while every measurement said the content fitted. -->
    <div data-sheet-body style="margin-top:16px;flex:1 1 0;min-height:0;overflow:hidden;"></div>

    <footer style="margin-top:18px;border-top:1px solid ${BRAND.border};padding-top:10px;">
      ${
        (input.notes ?? []).length
          ? `<p style="margin:0 0 6px;font-size:8px;line-height:1.55;color:${BRAND.faint};">${(input.notes ?? [])
              .map(escape)
              .join(" ")}</p>`
          : ""
      }
      <div style="display:flex;justify-content:space-between;font-size:9px;color:${BRAND.faint};">
        <span>JiPange · jipangefinance.org</span>
        <span>Analytics for education only, not financial advice.</span>
      </div>
    </footer>
  `;

  /* The clone, re-flowed. The live layout is one column because it is a phone
   * layout; on a 794px sheet that is a column of very wide, very empty cards.
   * Two columns is what turns a two-page export into a one-page document. */
  const slot = sheet.querySelector<HTMLElement>("[data-sheet-body]")!;
  const clone = input.body.cloneNode(true) as HTMLElement;
  clone.style.display = "grid";
  clone.style.gap = "12px";
  clone.style.alignItems = "start";

  /* Anything the page hides behind a disclosure but wants exported anyway.
   *
   * A document should not depend on which accordions the reader happened to
   * open before pressing Download. The year-by-year fee schedule is collapsed
   * by default and is the single most useful thing on the sheet. */
  clone.querySelectorAll<HTMLElement>("[data-export-include]").forEach((n) => {
    n.classList.remove("hidden");
    n.style.display = "block";
    n.style.overflow = "visible";
  });

  /* Underlines off.
   *
   * html2canvas draws an underline THROUGH the middle of the glyphs rather
   * than below them, so every export showed "itax.kra.go.ke" struck through —
   * which on a tax page reads as "this address has been withdrawn". The card
   * exporter learned this once already; the lesson has to travel with the new
   * path or it is simply relearned. Link colour still marks them.
   */
  clone.querySelectorAll<HTMLElement>("a, u, .underline").forEach((n) => {
    n.style.textDecoration = "none";
  });

  /* Chrome that belongs to the app, not to the document: share buttons, the
   * export controls themselves, anything the page marks print-hidden. */
  clone
    .querySelectorAll<HTMLElement>('[data-export-omit], .print\\:hidden, button')
    .forEach((n) => n.remove());

  /* Animations frozen. `animate-rise` starts at opacity 0 and the clone
   * remounts it, so an unfrozen capture lands mid-fade — every early export
   * came out washed pale until this was handled on the original path. */
  [clone, ...Array.from(clone.querySelectorAll<HTMLElement>("*"))].forEach((n) => {
    n.style.animation = "none";
    n.style.opacity = "1";
    n.style.transform = "none";
  });

  /* A wide table cannot sit in a grid cell. Anything that scrolls horizontally
   * on screen is given the full width of the sheet instead. */
  clone.querySelectorAll<HTMLElement>("table").forEach((t) => {
    const cell = t.closest<HTMLElement>("[class*='overflow']") ?? t;
    if (cell.parentElement === clone) cell.style.gridColumn = "1 / -1";
    t.style.width = "100%";
  });

  /* Columns chosen from how many stat cards there actually are, so the row
   * comes out full rather than with a hole in it. Four cards in three columns
   * leaves an empty cell the size of a stat card, which on a one-page document
   * reads as something having failed to render. */
  const statCount = Array.from(clone.children).filter(
    (c) => !c.querySelector("table")
  ).length;
  const maxCols = landscape ? 4 : 2;
  clone.style.gridTemplateColumns = `repeat(${Math.max(
    1,
    Math.min(statCount || 1, maxCols)
  )}, minmax(0,1fr))`;

  /* Big figures do not break across lines.
   *
   * On the Hustle Smoother sheet four of the five stat blocks rendered as
   * "Ksh" on one line and the number on the next, because a phone layout's
   * headline size meets a narrower column once the cards are re-flowed into a
   * grid. A currency symbol orphaned from its amount is not a cosmetic
   * complaint on a financial document — it reads, at a glance, as two figures.
   *
   * Applied by text size rather than by class, so it covers whatever the
   * calculators call their headline number. */
  clone.querySelectorAll<HTMLElement>("*").forEach((n) => {
    if (n.children.length) return;
    const size = parseFloat(window.getComputedStyle(n).fontSize || "0");
    if (size >= 20) n.style.whiteSpace = "nowrap";
  });

  slot.appendChild(clone);
  document.body.appendChild(sheet);

  /* Scale the body down if it overruns the sheet.
   *
   * The sheet is a fixed A4 box, so whatever is inside must fit inside it. Left
   * to grow, the capture came out taller than A4 and the placement scaled it to
   * fit the page HEIGHT — which shrank the width too and printed the document
   * letterboxed, with white bands down both margins and the text smaller than
   * it needed to be. Fitting the content to the box instead means the sheet
   * always fills the page edge to edge.
   */
  /* Measured from the CLONE as well as the slot, and the taller reading wins.
   *
   * The slot's own scroll metrics were the only signal, and the Hustle
   * Smoother export showed why that is not enough: the three-step list came
   * out cut off mid-item, under a footer that had rendered as though
   * everything fitted. The slot reported no overflow, so no scaling was
   * applied, so the fixed-height sheet simply clipped — the identical failure
   * the comment above the slot describes, reached by a different route.
   *
   * `scrollHeight` on a containing block is a claim about that block, and a
   * grid child can overrun it without the parent's number moving. The clone's
   * own height is a direct measurement of the thing being fitted, so it cannot
   * be defeated by whatever the container decides to report. Taking the larger
   * of the two costs nothing when they agree and is the only correct answer
   * when they do not. */
  const contentHeight = Math.max(slot.scrollHeight, clone.scrollHeight, clone.offsetHeight);
  const factor = fitScale(contentHeight, slot.clientHeight);
  if (factor < 1) {
    clone.style.transformOrigin = "top left";
    clone.style.transform = `scale(${factor})`;
    clone.style.width = `${100 / factor}%`;
  }

  return { node: sheet, dispose: () => sheet.remove() };
}

/**
 * Does this content want landscape?
 *
 * The rule is content-shaped rather than a per-tool flag: a sheet carrying a
 * table wide enough to scroll on screen reads better across the long edge, and
 * so does one with enough cards that two columns would run past the fold.
 * Everything else stays portrait, which is what a reader expects a one-page
 * statement to be.
 */
export function prefersLandscape(body: HTMLElement): boolean {
  /* A table is the only thing that genuinely wants the long edge.
   *
   * This also counted "more than six cards", which turned the Fuliza sheet
   * landscape purely because it carries six stats and two prose notes — and a
   * landscape page with no table has a third of itself empty at the bottom.
   * Card count is a reason to use more columns, not a reason to rotate the
   * paper.
   */
  return Array.from(body.querySelectorAll("table")).some(
    (t) => t.querySelectorAll("tbody tr").length > 6
  );
}
