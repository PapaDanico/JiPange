import { describe, it, expect, afterEach, vi } from "vitest";
import { canShareFile, shareFile, canvasToPngFile } from "../share-file";

/**
 * The share sheet's three endings.
 *
 * The one that matters is `cancelled`. A reader who opens the sheet and changes
 * their mind gets an AbortError, and the obvious `catch { setError(...) }`
 * turns every dismissal into "Could not share" — an error message for a normal
 * action, which is how people learn to ignore error messages.
 */

const PNG = () => new File([new Uint8Array([1, 2, 3])], "x.png", { type: "image/png" });

const withNavigator = (props: Record<string, unknown>) => {
  vi.stubGlobal("navigator", { ...props } as unknown as Navigator);
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("canShareFile asks the question that actually settles it", () => {
  it("is false when the browser has no share at all", () => {
    withNavigator({});
    expect(canShareFile(PNG())).toBe(false);
  });

  it("is false for Web Share Level 1 — share exists, files are not accepted", () => {
    // This is the case a bare `'share' in navigator` check gets wrong, and it
    // is not exotic: it is most desktop browsers.
    withNavigator({ share: vi.fn(), canShare: () => false });
    expect(canShareFile(PNG())).toBe(false);
  });

  it("is false when share exists but canShare does not", () => {
    withNavigator({ share: vi.fn() });
    expect(canShareFile(PNG())).toBe(false);
  });

  it("treats a throwing capability check as a no, not a crash", () => {
    withNavigator({
      share: vi.fn(),
      canShare: () => {
        throw new TypeError("Illegal invocation");
      },
    });
    expect(canShareFile(PNG())).toBe(false);
  });

  it("is true only when files are genuinely accepted", () => {
    withNavigator({ share: vi.fn(), canShare: (d: ShareData) => Array.isArray(d.files) });
    expect(canShareFile(PNG())).toBe(true);
  });
});

describe("shareFile reports what happened", () => {
  it("returns unsupported without calling share", async () => {
    const share = vi.fn();
    withNavigator({ share, canShare: () => false });
    expect(await shareFile(PNG())).toBe("unsupported");
    expect(share).not.toHaveBeenCalled();
  });

  it("returns shared and passes the file through", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    withNavigator({ share, canShare: () => true });
    expect(await shareFile(PNG(), { title: "Take-home pay" })).toBe("shared");
    const arg = share.mock.calls[0][0] as ShareData;
    expect(arg.files).toHaveLength(1);
    expect(arg.title).toBe("Take-home pay");
  });

  it("returns cancelled — not failed — when the reader dismisses the sheet", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("Share canceled", "AbortError"));
    withNavigator({ share, canShare: () => true });
    expect(await shareFile(PNG())).toBe("cancelled");
  });

  it("also reads a dismissal that arrives as a plain Error", async () => {
    // Some Android builds reject with a non-DOMException carrying the same
    // meaning. A dismissal is a dismissal however it is spelled.
    const share = vi.fn().mockRejectedValue(new Error("Share was aborted by the user"));
    withNavigator({ share, canShare: () => true });
    expect(await shareFile(PNG())).toBe("cancelled");
  });

  it("returns failed for a genuine error", async () => {
    const share = vi.fn().mockRejectedValue(new Error("Permission denied"));
    withNavigator({ share, canShare: () => true });
    expect(await shareFile(PNG())).toBe("failed");
  });
});

describe("canvasToPngFile", () => {
  it("returns null rather than throwing when toBlob is unavailable", async () => {
    // jsdom canvases and some older WebViews lack it; a null is something the
    // caller can show a message for, an exception is a broken button.
    const canvas = { } as HTMLCanvasElement;
    expect(await canvasToPngFile(canvas, "result")).toBeNull();
  });

  it("names the file after the tool so the shared image is identifiable", async () => {
    const canvas = {
      toBlob: (cb: (b: Blob | null) => void) => cb(new Blob([new Uint8Array([1])], { type: "image/png" })),
    } as unknown as HTMLCanvasElement;
    const file = await canvasToPngFile(canvas, "salary-hub");
    expect(file?.name).toBe("salary-hub.png");
    expect(file?.type).toBe("image/png");
  });

  it("returns null when the canvas yields no blob", async () => {
    const canvas = {
      toBlob: (cb: (b: Blob | null) => void) => cb(null),
    } as unknown as HTMLCanvasElement;
    expect(await canvasToPngFile(canvas, "x")).toBeNull();
  });
});
