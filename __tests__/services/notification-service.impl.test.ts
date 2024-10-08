import { describe, it, expect, vi, beforeEach } from "vitest";

import { StatusRateLimitStrategy } from "@/strategies/implementations/status-rate-limit.strategy";
import { NewsRateLimitStrategy } from "@/strategies/implementations/news-rate-limit.strategy";
import { MarketingRateLimitStrategy } from "@/strategies/implementations/marketing-rate-limit.strategy";

import { NotificationGateway } from "@/gateways/notification.gateway";

import { NotificationServiceImpl } from "@/services/notification-service.impl";

describe("NotificationServiceImpl", () => {
  let gateway: NotificationGateway;
  let service: NotificationServiceImpl;

  beforeEach(() => {
    gateway = { send: vi.fn() } as unknown as NotificationGateway;
    service = new NotificationServiceImpl(gateway);
  });

  it("should send a notification when under the rate limit", () => {
    vi.spyOn(StatusRateLimitStrategy.prototype, "isAllowed").mockReturnValue(
      true
    );
    vi.spyOn(StatusRateLimitStrategy.prototype, "registerRequest");

    service.send("status", "user1", "This is a status update");

    expect(gateway.send).toHaveBeenCalledWith(
      "user1",
      "This is a status update"
    );
    expect(StatusRateLimitStrategy.prototype.isAllowed).toHaveBeenCalledWith(
      "user1"
    );
    expect(
      StatusRateLimitStrategy.prototype.registerRequest
    ).toHaveBeenCalledWith("user1");
  });

  it("should not send a notification when rate limit is exceeded", () => {
    vi.spyOn(StatusRateLimitStrategy.prototype, "isAllowed").mockReturnValue(
      false
    );

    service.send("status", "user1", "This is a status update");

    expect(gateway.send).not.toHaveBeenCalled();
    expect(StatusRateLimitStrategy.prototype.isAllowed).toHaveBeenCalledWith(
      "user1"
    );
  });

  it("should use the correct strategy for each notification type", () => {
    const statusSpy = vi
      .spyOn(StatusRateLimitStrategy.prototype, "isAllowed")
      .mockReturnValue(true);
    const newsSpy = vi
      .spyOn(NewsRateLimitStrategy.prototype, "isAllowed")
      .mockReturnValue(true);
    const marketingSpy = vi
      .spyOn(MarketingRateLimitStrategy.prototype, "isAllowed")
      .mockReturnValue(true);

    service.send("status", "user1", "Status message");
    service.send("news", "user1", "News message");
    service.send("marketing", "user1", "Marketing message");

    expect(statusSpy).toHaveBeenCalled();
    expect(newsSpy).toHaveBeenCalled();
    expect(marketingSpy).toHaveBeenCalled();
  });

  it("should not send a notification when the strategy does not exist", () => {
    const consoleSpy = vi.spyOn(console, "log");

    service.send("unknown", "user1", "Unknown type message");

    expect(gateway.send).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Strategy not found for type unknown"
    );

    consoleSpy.mockRestore();
  });
});
