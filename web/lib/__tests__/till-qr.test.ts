import { describe, expect, it } from "vitest";
import { statSync } from "fs";
import { join } from "path";

describe("the till QR on /support", () => {
  const file = join(process.cwd(), "public", "pay", "till-qr.png");
  it("ships, and stays a few kilobytes", () => {
    expect(statSync(file).size).toBeGreaterThan(1_000);
    expect(statSync(file).size).toBeLessThan(10_000);
  });
});

describe("the Danico Ventures logo", () => {
  it("ships, at a few kilobytes", () => {
    const f = join(process.cwd(), "public", "brand", "danico-logo.webp");
    expect(statSync(f).size).toBeGreaterThan(500);
    expect(statSync(f).size).toBeLessThan(6_000);
  });
});
