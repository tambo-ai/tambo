import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ThrottlerModuleOptions, ThrottlerStorage } from "@nestjs/throttler";
import { Request, Response } from "express";
import { RateLimitException } from "../../threads/types/errors";
import { RateLimitGuard } from "./rate-limit.guard";

const options: ThrottlerModuleOptions = {
  throttlers: [{ name: "default", limit: 2, ttl: 60_000 }],
};

function createGuard(): RateLimitGuard {
  return new RateLimitGuard(options, {} as ThrottlerStorage, new Reflector());
}

function createMockContext(
  req: Partial<Request>,
  res: Partial<Response>,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as unknown as ExecutionContext;
}

describe("RateLimitGuard", () => {
  describe("getTracker", () => {
    it("keys anonymous callers by normalized source address", async () => {
      const guard = createGuard();
      await expect(guard["getTracker"]({ ip: "203.0.113.7" })).resolves.toBe(
        "ip:203.0.113.7",
      );
    });

    it("produces distinct buckets for distinct addresses", async () => {
      const guard = createGuard();
      const first = await guard["getTracker"]({
        ip: "203.0.113.7",
      });
      const second = await guard["getTracker"]({
        ip: "203.0.113.8",
      });
      expect(first).not.toBe(second);
    });

    it("falls back to the socket address when ip is missing", async () => {
      const guard = createGuard();
      await expect(
        guard["getTracker"]({
          socket: { remoteAddress: "198.51.100.9" },
        }),
      ).resolves.toBe("ip:198.51.100.9");
    });

    it("never returns an empty tracker", async () => {
      const guard = createGuard();
      const tracker = await guard["getTracker"]({});
      expect(tracker.length).toBeGreaterThan("ip:".length);
    });
  });

  describe("throwThrottlingException", () => {
    it("throws RateLimitException so the handler never runs", async () => {
      const guard = createGuard();
      const header = jest.fn();
      const res = { headersSent: false, header, setHeader: jest.fn() };
      const context = createMockContext(
        { originalUrl: "/v1/threads", url: "/v1/threads" },
        res,
      );
      const handler = jest.fn();
      await expect(
        guard["throwThrottlingException"](context, {
          ttl: 60_000,
          limit: 2,
          key: "key",
          tracker: "ip:203.0.113.7",
          totalHits: 3,
          timeToExpire: 42,
          isBlocked: true,
          timeToBlockExpire: 42,
        }).then(handler),
      ).rejects.toBeInstanceOf(RateLimitException);
      expect(handler).not.toHaveBeenCalled();
    });

    it("emits Retry-After and X-RateLimit-* headers with a 429 body", async () => {
      const guard = createGuard();
      const header = jest.fn();
      const res = { headersSent: false, header, setHeader: jest.fn() };
      const context = createMockContext(
        { originalUrl: "/v1/threads", url: "/v1/threads" },
        res,
      );
      const thrown = await guard["throwThrottlingException"](context, {
        ttl: 60_000,
        limit: 2,
        key: "key",
        tracker: "ip:203.0.113.7",
        totalHits: 3,
        timeToExpire: 42,
        isBlocked: true,
        timeToBlockExpire: 42,
      }).catch((error: unknown) => error);
      expect(thrown).toBeInstanceOf(RateLimitException);
      const body = (thrown as RateLimitException).getResponse();
      expect(body).toMatchObject({
        type: "https://docs.tambo.co/reference/problems/rate-limit",
        status: 429,
        title: "Too Many Requests",
        detail: "Rate limit exceeded. Try again in 42 seconds.",
        instance: "/v1/threads",
      });
      expect(header).toHaveBeenCalledWith("Retry-After", 42);
      expect(header).toHaveBeenCalledWith("X-RateLimit-Limit", 2);
      expect(header).toHaveBeenCalledWith("X-RateLimit-Remaining", 0);
      expect(header).toHaveBeenCalledWith("X-RateLimit-Reset", 42);
    });

    it("advertises at least one second when no expiry is reported", async () => {
      const guard = createGuard();
      const header = jest.fn();
      const res = { headersSent: false, header, setHeader: jest.fn() };
      const context = createMockContext({ url: "/v1/threads" }, res);
      const thrown = await guard["throwThrottlingException"](context, {
        ttl: 60_000,
        limit: 2,
        key: "key",
        tracker: "ip:203.0.113.7",
        totalHits: 3,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: 0,
      }).catch((error: unknown) => error);
      expect(header).toHaveBeenCalledWith("Retry-After", 1);
      expect((thrown as RateLimitException).getResponse()).toMatchObject({
        status: 429,
      });
    });

    it("writes nothing when headers are already sent", async () => {
      const guard = createGuard();
      const header = jest.fn();
      const res = { headersSent: true, header, setHeader: jest.fn() };
      const context = createMockContext({ url: "/v1/threads" }, res);
      await expect(
        guard["throwThrottlingException"](context, {
          ttl: 60_000,
          limit: 2,
          key: "key",
          tracker: "ip:203.0.113.7",
          totalHits: 3,
          timeToExpire: 42,
          isBlocked: true,
          timeToBlockExpire: 42,
        }),
      ).rejects.toBeInstanceOf(RateLimitException);
      expect(header).not.toHaveBeenCalled();
    });
  });
});
