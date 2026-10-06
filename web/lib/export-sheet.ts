import { TOOL_META } from "./tool-meta";
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
/** The most short content is enlarged to fill a page. */
export const MAX_FILL_SCALE = 1.6;

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
export interface BuiltSheet {
  node: HTMLElement;
  dispose: () => void;
  /** How many A4 pages the content needs. 1 unless it flowed into columns. */
  pages: number;
  /** Show page `k` (0-based) of a multi-page sheet before capturing it. */
  showPage: (k: number) => void;
}

/** Columns per page when tall content flows. Landscape is the default since
 *  4 Oct 2026 (owner's call): three columns across 1123px use the page;
 *  one phone-width column used 45% of it. */
export const FLOW_COLUMNS = { landscape: 3, portrait: 2 } as const;
const FLOW_GAP = 24;
/** Narrowest grid cell (px) allowed to survive into a flow column. */
const MIN_FLOW_CELL = 160;

/** Any text that ends past the inner edge of its own box is scaled down until
 *  it does not. Measured on the FINAL layout (after any scaling or column
 *  flow) — run earlier it read the wrong widths: it clipped Money Runway's
 *  headline and, reading inline elements' zero clientWidth as overflow,
 *  shrank School Fees to unreadable type. */
function fitOverflowingText(root: HTMLElement): void {
  Array.from(root.querySelectorAll<HTMLElement>("*")).forEach((n) => {
    if (n.children.length || !n.textContent?.trim()) return;
    // Only one-line text is fitted; prose wraps on its own.
    if (getComputedStyle(n).whiteSpace !== "nowrap") return;
    // Against the CARD it sits in (the root's direct child), not its own
    // wrapper — an inline wrapper grows with the text and never "overflows".
    // The nearest ancestor that draws a box (fill or border), else the card
    // the text sits in (the root's direct child). An inline wrapper grows
    // with its text and never "overflows", so it is never the reference.
    const framed = (el: HTMLElement) => {
      const c = getComputedStyle(el);
      return c.backgroundColor !== "rgba(0, 0, 0, 0)" || parseFloat(c.borderRightWidth) > 0;
    };
    let box: HTMLElement | null = n.parentElement;
    while (box && box !== root && box.parentElement !== root && !framed(box)) box = box.parentElement;
    if (!box || box === root) return;
    const cs = getComputedStyle(box);
    const inner =
      box.getBoundingClientRect().right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth);
    const r = n.getBoundingClientRect();
    // A block's edge does not move when its text overflows; its scrollWidth
    // does. Inline elements report clientWidth 0, so only blocks use it.
    const scrolled = n.clientWidth > 0 ? n.scrollWidth - n.clientWidth : 0;
    const over = Math.max(r.right - inner, scrolled);
    if (over > 1 && r.width > over) {
      const size = parseFloat(getComputedStyle(n).fontSize);
      const width = n.clientWidth > 0 ? n.scrollWidth : r.width;
      n.style.fontSize = `${Math.floor((size * (width - over)) / width)}px`;
    }
  });
}

/**
 * A row of cards keeps its screen tracks inside whatever slice of the page it
 * lands in: DhowCSD's three rungs came out ~110px each, one word per line
 * (6 Oct). Any grid whose cells would fall under MIN_FLOW_CELL stacks
 * instead. Called before measuring, so heights are the real ones.
 */
function stackNarrowGrids(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>("*").forEach((g) => {
    const cs = getComputedStyle(g);
    if (cs.display !== "grid" && cs.display !== "inline-grid") return;
    const tracks = cs.gridTemplateColumns.split(" ").filter(Boolean).length;
    if (tracks > 1 && g.clientWidth / tracks < MIN_FLOW_CELL) g.style.gridTemplateColumns = "minmax(0, 1fr)";
  });
}

export function buildSheet(input: SheetInput): BuiltSheet {
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
  let clone = input.body.cloneNode(true) as HTMLElement;
  /* A SINGLE WRAPPER IS NOT A LAYOUT. My Pesa Picture's export came back as
   * one phone-width column on 45% of the page with its last section cut off:
   * its body is one wrapper div, so the grid below saw one item and gave it
   * one column, and the wrapper's own max-width held it narrow. Descend
   * through lone wrappers to the real blocks, and let nothing cap its width. */
  while (clone.children.length === 1 && !clone.querySelector(":scope > table")) {
    const only = clone.firstElementChild as HTMLElement;
    if (!only.children.length) break;
    clone = only;
  }
  [clone, ...Array.from(clone.querySelectorAll<HTMLElement>("*"))].forEach((n) => {
    n.style.maxWidth = "none";
  });
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

  /* Closed <details>: html2canvas paints their bodies anyway, over whatever
   * follows, because the layout gave them no boxes. The image path hides them
   * for the capture (ExportCardButton); this is the same fix for the sheet.
   * Removed rather than hidden — the clone is thrown away after. Summaries
   * lose their marker, which html2canvas draws as a list number. */
  /* A closed <details> on paper is only its summary: a collapsed control
   * ("How this works — 30-second tutorial") that cannot be opened. Payday
   * Router's sheet spent a third of its page on one (6 Oct). Dropped whole. */
  clone.querySelectorAll<HTMLDetailsElement>("details:not([open])").forEach((d) => d.remove());
  clone.querySelectorAll<HTMLElement>("summary").forEach((s) => {
    s.style.listStyle = "none";
  });

  /* Shadows off. html2canvas paints a Tailwind box-shadow (a color-mix value)
   * as a solid grey slab behind the card, so the FIRE sheet's white cards
   * came out as grey blocks with white corner flecks. The border carries the
   * card edge on paper. */
  [clone, ...Array.from(clone.querySelectorAll<HTMLElement>("*"))].forEach((n) => {
    n.style.boxShadow = "none";
  });

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
  // The app's own single-line styling (truncate / nowrap) clips a long
  // sentence on paper — Money Runway's "Forever — your balance keeps
  // growing". Long non-figure text is allowed to wrap.
  clone.querySelectorAll<HTMLElement>(".truncate, .whitespace-nowrap, .text-ellipsis").forEach((n) => {
    const t = n.textContent?.trim() ?? "";
    if (t.length > 24 || !/\d/.test(t)) {
      n.style.whiteSpace = "normal";
      n.style.overflow = "visible";
      n.style.textOverflow = "clip";
    }
  });
  clone.querySelectorAll<HTMLElement>("*").forEach((n) => {
    if (n.children.length) return;
    const size = parseFloat(window.getComputedStyle(n).fontSize || "0");
    // Large FIGURES stay on one line; a large sentence ("Forever — your
    // balance keeps growing", Money Runway) wraps instead of being clipped.
    const t = n.textContent?.trim() ?? "";
    if (size >= 20 && /\d/.test(t) && t.length <= 24) n.style.whiteSpace = "nowrap";
  });

  slot.appendChild(clone);
  document.body.appendChild(sheet);

  /* Headline figures on one line, shrunk to their column.
   *
   * ResultCard figures wrap anywhere (break-words), which on screen is a
   * safety net and on a narrow sheet column split "Ksh 18,906" into
   * "Ksh 18," / "906". Measured, not guessed: each figure is set nowrap and,
   * only if it then overruns its box, its font is reduced in proportion. */
  /* Filled links are calls to action ("Open the goal planners →"): a button
   * on paper does nothing, so it goes, like the real buttons above. */
  clone.querySelectorAll<HTMLElement>("a[href]").forEach((n) => {
    if (/\bbg-(accent|primary|ink)\b/.test(n.className)) n.remove();
  });
  /* Every one-line figure, not only .tabular-nums: a large amount held on one
   * line (nowrap, above) ran out of its card — "Ksh 30,559,608" in Wealth at
   * age 60 — because only tabular-nums text was shrunk to fit. */
  clone.querySelectorAll<HTMLElement>(".tabular-nums").forEach((n) => {
    // Figures only: a tabular-nums SENTENCE ("Forever — your balance keeps
    // growing") must wrap, not be forced to one line and clipped.
    const tn = n.textContent?.trim() ?? "";
    if (!(/\d/.test(tn) && tn.length <= 24)) return;
    n.style.whiteSpace = "nowrap";
    n.style.overflowWrap = "normal";
    n.style.wordBreak = "normal";
    const avail = n.clientWidth;
    if (avail > 0 && n.scrollWidth > avail) {
      const size = parseFloat(getComputedStyle(n).fontSize);
      n.style.fontSize = `${Math.floor((size * avail) / n.scrollWidth)}px`;
    }
  });

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
  const avail = slot.clientHeight;
  let pages = 1;
  let showPage: (k: number) => void = () => {};
  /* A little over the page: shrink, as before — a summary that misses by a
   * few lines reads better slightly smaller than split. Well over: flow into
   * columns across the page, and past the last column onto further pages.
   * Never crop: the old path stopped shrinking at 50% and the fixed-height
   * sheet clipped the rest, which is how "Wealth at age 60" vanished. */
  /* Tables never flow into columns: a fee table squeezed into a third of the
   * page spilled its amount column sideways and broke across pages (School
   * Fees, 4 Oct). A table keeps the full width and the sheet shrinks to fit. */
  const hasTable = !!clone.querySelector("table");
  if (hasTable || contentHeight <= avail * 1.25) {
    stackNarrowGrids(clone);
    /* Short content GROWS to use the page, up to MAX_FILL_SCALE. Landscape
     * by default made this matter: measured 4 Oct, Payday Router used 14% of
     * its page body, KPLC 24%, the 20th Challenge 27% — a few figures in the
     * top corner of a blank sheet. Capped so a two-line result does not turn
     * into a poster. */
    // The slot's own scrollHeight is never less than the slot, so growth is
    // judged on the content's natural height alone.
    const natural = Math.max(clone.scrollHeight, clone.offsetHeight);
    const factor =
      natural > 0 && natural < avail ? Math.min(MAX_FILL_SCALE, avail / natural) : fitScale(contentHeight, avail);
    if (factor !== 1) {
      clone.style.transformOrigin = "top left";
      clone.style.transform = `scale(${factor})`;
      clone.style.width = `${100 / factor}%`;
    }
  } else {
    const cols = landscape ? FLOW_COLUMNS.landscape : FLOW_COLUMNS.portrait;
    /* Each block's height AT COLUMN WIDTH, measured before columns fragment
     * it (a fragmented block reports only its first piece). */
    const colW = (slot.clientWidth - FLOW_GAP * (cols - 1)) / cols;
    Object.assign(clone.style, { display: "block", width: `${colW}px`, gridTemplateColumns: "" } as CSSStyleDeclaration);
    const tall = new Set(
      Array.from(clone.children).filter((c) => (c as HTMLElement).offsetHeight > avail),
    );
    /* Inside a block that will break, any part tall enough to break with it
     * must lose its fill too: html2canvas paints a fragmented box as ONE
     * rectangle spanning every column it touches, so FIRE Number's yellow
     * inner cards were painted over the "What you need at 60" headline that
     * shared the first column (6 Oct). Small chips keep their colour. */
    const breakable = new Set<HTMLElement>();
    tall.forEach((t) =>
      (t as HTMLElement).querySelectorAll<HTMLElement>("*").forEach((d) => {
        if (d.offsetHeight > avail / 4) breakable.add(d);
      }),
    );
    Object.assign(clone.style, {
      display: "block",
      gridTemplateColumns: "",
      columnCount: String(cols),
      columnGap: `${FLOW_GAP}px`,
      columnFill: "auto",
      height: `${avail}px`,
      width: "100%",
    } as CSSStyleDeclaration);
    /* Blocks that fit a column stay whole. One taller than a column has to
     * break, and loses its frame and fill so the break does not show a card
     * torn in half (FIRE Number's yellow panel). Splitting such containers
     * into their parts was tried and dropped content from My Pesa Picture. */
    breakable.forEach((d) => {
      d.style.background = "none";
      d.style.border = "none";
    });
    Array.from(clone.children).forEach((c) => {
      const el = c as HTMLElement;
      if (tall.has(el)) {
        el.style.breakInside = "auto";
        el.style.background = "none";
        el.style.border = "none";
        el.style.padding = "0";
        el.style.marginBottom = "12px";
        return;
      }
      el.style.breakInside = "avoid";
      el.style.marginBottom = "12px";
      el.style.gridColumn = "";
    });
    /* Columns that do not fit run off to the right; each further page is the
     * next band of them, slid into view. */
    const band = slot.clientWidth + FLOW_GAP;
    pages = Math.max(1, Math.ceil((clone.scrollWidth + FLOW_GAP - 1) / band));
    showPage = (k) => {
      clone.style.transform = k ? `translateX(${-k * band}px)` : "none";
    };
  }
  fitOverflowingText(clone);
  return { node: sheet, dispose: () => sheet.remove(), pages, showPage };
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
  const tables = Array.from(body.querySelectorAll("table"));
  /* Long tables, as before. */
  if (tables.some((t) => t.querySelectorAll("tbody tr").length > 6)) return true;
  /* Wide tables: five or more columns squeeze to unreadable widths on the
   * 794px portrait sheet, whatever their row count. */
  if (tables.some((t) => (t.querySelector("tr")?.children.length ?? 0) >= 5)) return true;
  /* Charts: a time series or growth curve reads along its x-axis, and the
   * long edge gives it 50% more of one. Added 3 Oct 2026 at the owner's
   * request ("landscape is better in some cases"). Card count still does
   * not rotate the paper — see above. */
  /* Only a chart the sheet will actually carry. Charts marked print:hidden
   * or data-export-omit are removed from the clone, and counting them turned
   * Money Runway into an empty landscape page. */
  return Array.from(body.querySelectorAll(".recharts-wrapper, svg[data-export-landscape]")).some(
    (c) => !c.closest(".print\\:hidden, [data-export-omit]")
  );
}

/**
 * Wait for webfonts before rasterising, with a bound.
 *
 * The exports are captured from the live DOM, and the capture measures
 * whatever is laid out at that instant. Figtree and Source Serif 4 are
 * webfonts: on a cold load — a reader who opens a tool, types, and hits
 * Export before the font files land — the card is still laid out in the
 * fallback stack, and the file they keep is metrically different from the
 * page they were looking at. On a narrow card that is a wrapped headline or
 * a figure pushed onto a second line.
 *
 * `document.fonts.ready` settles once the document's font loads have
 * finished, which is the signal wanted here. It is awaited with a timeout
 * rather than bare, for the case the promise never settles (a font request
 * hanging on a bad connection, a browser that resolves it late): a slightly
 * mis-metricked export is a cosmetic fault, an Export button that never
 * returns is a broken one, and the second is worse. The timeout is not an
 * error path — capture proceeds either way.
 */
export const FONT_READY_TIMEOUT_MS = 2000;

export async function awaitFonts(timeoutMs: number = FONT_READY_TIMEOUT_MS): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  if (document.fonts.status === "loaded") return;
  await Promise.race([
    document.fonts.ready.then(() => undefined),
    new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs);
    }),
  ]);
}

/**
 * The document's title, in order of preference: written, registered, derived.
 *
 * Title-casing the filename slug is a last resort and it showed: the Hustle
 * Income Smoother's sheet was headed "Hustle Smoother", because the slug is
 * `hustle-smoother` and the slug is not the name. On a document a reader may
 * forward to a SACCO or a bursar, the masthead naming a tool that does not
 * exist is not a small thing.
 *
 * TOOL_META already holds the canonical name for every tool, keyed by the same
 * route the slug comes from, so the registry is consulted before falling back
 * to string manipulation. Same move as the planner naming fix: read the name,
 * do not reconstruct it.
 */
export function titleFromFilename(name: string): string {
  /* Some filenames extend the route slug (`dhowcsd-ladder` for /tools/dhowcsd,
   * `chama-calculator`, `land-purchase-costs`), and missing the registry for
   * those printed "Dhowcsd Ladder". Trim trailing words until a route matches. */
  for (let slug = name; slug; slug = slug.includes("-") ? slug.slice(0, slug.lastIndexOf("-")) : "") {
    const registered = TOOL_META[`/tools/${slug}`]?.name;
    if (registered) return registered;
  }
  const words = name.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!words) return "Result";
  return words.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}
