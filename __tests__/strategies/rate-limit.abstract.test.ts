import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RateLimitAbstract } from "@/strategies/rate-limit.abstract";

class MockRateLimitStrategy extends RateLimitAbstract {
  protected limit = 2;
  protected windowTime = 60 * 1000;
}

describe("rate limit abstract", () => {
  let sut: MockRateLimitStrategy;

  beforeEach(() => {
    sut = new MockRateLimitStrategy();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should allow requests under the limit", () => {
    sut.registerRequest("user1");
    expect(sut.isAllowed("user1")).toBe(true);

    sut.registerRequest("user1");
    expect(sut.isAllowed("user1")).toBe(true);

    sut.registerRequest("user1");
    expect(sut.isAllowed("user1")).toBe(false);
  });

  it("should reject requests over the limit", () => {
    sut.registerRequest("user1");
    sut.registerRequest("user1");
    sut.registerRequest("user1");

    expect(sut.isAllowed("user1")).toBe(false);
  });

  it("should reset limit after window time has passed", () => {
    const initialTime = Date.now();
    vi.setSystemTime(initialTime);

    sut.registerRequest("user1");
    sut.registerRequest("user1");
    sut.registerRequest("user1");

    expect(sut.isAllowed("user1")).toBe(false);

    vi.advanceTimersByTime(61 * 1000);

    sut.registerRequest("user1");
    expect(sut.isAllowed("user1")).toBe(true);

    vi.useRealTimers();
  });

  it("should correctly handle multiple users", () => {
    sut.registerRequest("user1");
    sut.registerRequest("user2");
    expect(sut.isAllowed("user1")).toBe(true);
    expect(sut.isAllowed("user2")).toBe(true);

    sut.registerRequest("user1");
    sut.registerRequest("user2");

    sut.registerRequest("user1");
    sut.registerRequest("user2");
    expect(sut.isAllowed("user1")).toBe(false);
    expect(sut.isAllowed("user2")).toBe(false);
  });

  it("should initialize timestamps array for a new userId", () => {
    expect(sut.isAllowed("newUser")).toBe(true);

    sut.registerRequest("newUser");
    expect(sut.isAllowed("newUser")).toBe(true);

    const timestamps = sut["requests"].get("newUser");
    expect(timestamps).toBeDefined();
    expect(timestamps?.length).toBe(1);
  });
});
