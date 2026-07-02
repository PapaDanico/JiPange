import { describe, expect, it } from "vitest";
import { normalizeKenyanPhoneNumber } from "../whatsapp";

describe("normalizeKenyanPhoneNumber", () => {
  it("normalizes a local 07XX number", () => {
    expect(normalizeKenyanPhoneNumber("0712345678")).toBe("254712345678");
  });

  it("normalizes a local 01XX number", () => {
    expect(normalizeKenyanPhoneNumber("0112345678")).toBe("254112345678");
  });

  it("normalizes a number with spaces", () => {
    expect(normalizeKenyanPhoneNumber("07XX XXX XXX".replace(/X/g, "1"))).toBe(
      normalizeKenyanPhoneNumber("0711111111")
    );
    expect(normalizeKenyanPhoneNumber("0712 345 678")).toBe("254712345678");
  });

  it("normalizes an already-international +254 number", () => {
    expect(normalizeKenyanPhoneNumber("+254712345678")).toBe("254712345678");
  });

  it("normalizes an international number without the plus sign", () => {
    expect(normalizeKenyanPhoneNumber("254712345678")).toBe("254712345678");
  });

  it("rejects numbers that don't start with a valid Kenyan mobile prefix", () => {
    expect(normalizeKenyanPhoneNumber("0212345678")).toBeNull();
  });

  it("rejects too-short or too-long numbers", () => {
    expect(normalizeKenyanPhoneNumber("07123")).toBeNull();
    expect(normalizeKenyanPhoneNumber("071234567890")).toBeNull();
  });

  it("rejects empty or non-numeric input", () => {
    expect(normalizeKenyanPhoneNumber("")).toBeNull();
    expect(normalizeKenyanPhoneNumber("not a number")).toBeNull();
  });
});
