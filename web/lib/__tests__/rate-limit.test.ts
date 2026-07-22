import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGet = vi.fn();
const mockSetJSON = vi.fn();

vi.mock("@netlify/blobs", () => ({
  getStore: () => ({ get: mockGet, setJSON: mockSetJSON }),
}));

const { enforceRateLimit, RateLimitedError } = await import("../rate-limit");

function requestFromIp(ip: string): Request {
  return new Request("https://example.com/api/test", {
    headers: { "x-nf-client-connection-ip": ip },
  });
}

describe("enforceRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    mockGet.mockReset();
    mockSetJSON.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first request from a fresh IP and records it", async () => {
    mockGet.mockResolvedValue(null);
    await enforceRateLimit(requestFromIp("1.2.3.4"), "generate-plan");
    expect(mockSetJSON).toHaveBeenCalledWith(
      "generate-plan:1.2.3.4",
      expect.objectContaining({ count: 1 })
    );
  });

  it("throws RateLimitedError once the same-window count exceeds the cap", async () => {
    const windowStart = Math.floor(Date.now() / (60 * 60 * 1000));
    mockGet.mockResolvedValue({ windowStart, count: 10 });
    await expect(enforceRateLimit(requestFromIp("1.2.3.4"), "generate-plan")).rejects.toThrow(
      RateLimitedError
    );
    // Should not record the rejected attempt as a new count.
    expect(mockSetJSON).not.toHaveBeenCalled();
  });

  it("resets the count once the stored window has rolled over", async () => {
    const staleWindowStart = Math.floor(Date.now() / (60 * 60 * 1000)) - 1;
    mockGet.mockResolvedValue({ windowStart: staleWindowStart, count: 10 });
    await enforceRateLimit(requestFromIp("1.2.3.4"), "generate-plan");
    expect(mockSetJSON).toHaveBeenCalledWith(
      "generate-plan:1.2.3.4",
      expect.objectContaining({ count: 1 })
    );
  });

  it("keys distinct IPs independently", async () => {
    const windowStart = Math.floor(Date.now() / (60 * 60 * 1000));
    mockGet.mockImplementation((key: string) =>
      Promise.resolve(key.endsWith("1.1.1.1") ? { windowStart, count: 10 } : null)
    );
    await expect(enforceRateLimit(requestFromIp("1.1.1.1"), "generate-plan")).rejects.toThrow(
      RateLimitedError
    );
    await expect(
      enforceRateLimit(requestFromIp("9.9.9.9"), "generate-plan")
    ).resolves.toBeUndefined();
  });

  it("fails open (allows the request) when the store is unreachable", async () => {
    mockGet.mockRejectedValue(new Error("store unavailable"));
    await expect(
      enforceRateLimit(requestFromIp("1.2.3.4"), "generate-plan")
    ).resolves.toBeUndefined();
  });
});
