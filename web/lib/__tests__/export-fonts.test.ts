import { describe, it, expect, vi, afterEach } from "vitest";
import { awaitFonts, FONT_READY_TIMEOUT_MS } from "../export-sheet";

/**
 * The capture paths in ExportCardButton read the live DOM, so a capture taken
 * before the webfonts land is laid out in the fallback stack and the exported
 * file does not match the page. awaitFonts is the wait; these fix the two
 * properties the export depends on — that it actually waits, and that it
 * cannot hang the Export button if the font promise never settles.
 */
/* The suite runs in the `node` environment (vitest.config.ts), so `document`
   is stubbed rather than provided by jsdom. awaitFonts touches exactly two
   things on it — `fonts.status` and `fonts.ready` — so a two-field stand-in
   exercises the real code path without pulling a DOM implementation in for
   four tests. */
const globals = globalThis as unknown as { document?: unknown };
const hadDocument = "document" in globals;
const originalDocument = globals.document;

function stubFonts(fonts: unknown) {
  globals.document = { fonts };
}

afterEach(() => {
  if (hadDocument) globals.document = originalDocument;
  else delete globals.document;
  vi.useRealTimers();
});

describe("awaitFonts", () => {
  it("waits for document.fonts.ready when fonts are still loading", async () => {
    let settle!: () => void;
    const ready = new Promise<void>((resolve) => {
      settle = resolve;
    });
    stubFonts({ status: "loading", ready });

    let done = false;
    const waited = awaitFonts().then(() => {
      done = true;
    });
    await Promise.resolve();
    expect(done).toBe(false);

    settle();
    await waited;
    expect(done).toBe(true);
  });

  it("returns immediately once loading has finished", async () => {
    stubFonts({
      status: "loaded",
      ready: new Promise<void>(() => {
        /* never settles — must not be awaited */
      }),
    });
    await expect(awaitFonts()).resolves.toBeUndefined();
  });

  it("gives up after the timeout rather than hanging the export", async () => {
    vi.useFakeTimers();
    stubFonts({
      status: "loading",
      ready: new Promise<void>(() => {
        /* never settles */
      }),
    });

    let done = false;
    const waited = awaitFonts(50).then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(49);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await waited;
    expect(done).toBe(true);
  });

  it("is a no-op where the Font Loading API is absent", async () => {
    stubFonts(undefined);
    await expect(awaitFonts()).resolves.toBeUndefined();
    expect(FONT_READY_TIMEOUT_MS).toBeGreaterThan(0);
  });
});
