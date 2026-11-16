import { describe, expect, it } from "vitest";
import { toPdfText } from "../export-text-layer";

describe("toPdfText", () => {
  it("maps typographic punctuation to what the standard PDF fonts can draw", () => {
    expect(toPdfText("Ksh 1,500 – Ksh 3,500")).toBe("Ksh 1,500 - Ksh 3,500");
    expect(toPdfText("it’s “net”")).toBe("it's \"net\"");
    expect(toPdfText("100 ÷ (1 + r × d)")).toBe("100 / (1 + r x d)");
  });
  it("drops symbols it cannot draw instead of printing garbage, and keeps Latin-1", () => {
    expect(toPdfText("✓ Inpatient care")).toBe("Inpatient care");
    expect(toPdfText("café")).toBe("café");
    expect(toPdfText("\u{1F6E1} Safe")).toBe("Safe");
  });
});
