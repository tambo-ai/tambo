import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ThrottlerModuleOptions, ThrottlerStorage } from "@nestjs/throttler";
import { hashKey } from "@tambo-ai-cloud/core";
import { Request, Response } from "express";
import { RateLimitGuard } from "./rate-limit.guard";

function createMockContext(
  headers: Record<string, string> = {},
  ip = "127.0.0.1",
): ExecutionContext {
  const mockRequest = {
    headers,
    ip,
    socket: { remoteAddress: ip },
    originalUrl: "/test",
    url: "/test",
  } as unknown as Request;

  const mockResponse = {
    headersSent: false,
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    header: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;

  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
      getResponse: () => mockResponse,
    }),
  } as unknown as ExecutionContext;
}

function createGuard(): RateLimitGuard {
  const options: ThrottlerModuleOptions = {
    throttlers: [
      { name: "default", limit: 100, ttl: 60_000 },
      { name: "streaming", limit: 20, ttl: 60_000 },
      { name: "strict", limit: 10, ttl: 60_000 },
    ],
  };

  const storage: ThrottlerStorage = {
    increment: jest.fn().mockResolvedValue({
      totalHits: 1,
      timeToExpire: 60_000,
      timeToExpireFromFirst: 60_000,
      isBlocked: false,
      blockDuration: 0,
      blockedStatuses: [],
    }),
    decrement: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn().mockResolvedValue(undefined),
  };

  const reflector = new Reflector();

  return new RateLimitGuard(options, storage, reflector);
}

describe("RateLimitGuard", () => {
  let guard: RateLimitGuard;

  beforeEach(() => {
    guard = createGuard();
  });

  describe("getTracker", () => {
    it("should return hashed API key as tracker when x-api-key header is present", async () => {
      const apiKey = "tambo_test-key-123";
      const context = createMockContext({ "x-api-key": apiKey });

      const req = context.switchToHttp().getRequest();
      const tracker = await (guard as any).getTracker(req);

      expect(tracker).toBe(`apikey:${hashKey(apiKey)}`);
    });

    it("should return IP-based tracker when no API key is present", async () => {
      const context = createMockContext({}, "192.168.1.100");

      const req = context.switchToHttp().getRequest();
      const tracker = await (guard as any).getTracker(req);

      expect(tracker).toBe("ip:192.168.1.100");
    });

    it("should handle array API key header", async () => {
      const apiKey = "tambo_array-key";
      const context = createMockContext({ "x-api-key": [apiKey] });

      const req = context.switchToHttp().getRequest();
      const tracker = await (guard as any).getTracker(req);

      expect(tracker).toBe(`apikey:${hashKey(apiKey)}`);
    });

    it("should fall back to unknown when IP is unavailable", async () => {
      const context = createMockContext({});

      const req = context.switchToHttp().getRequest();
      req.ip = undefined;
      (req.socket).remoteAddress = undefined;
      const tracker = await (guard as any).getTracker(req);

      expect(tracker).toBe("ip:unknown");
    });
  });

  describe("getRequestResponse", () => {
    it("should extract req and res from execution context", () => {
      const context = createMockContext();

      const result = guard.getRequestResponse(context);

      expect(result.req).toBeDefined();
      expect(result.res).toBeDefined();
    });
  });

  describe("throwThrottlingException", () => {
    it("should return 429 with RFC 9457 Problem Details body", async () => {
      const context = createMockContext({}, "10.0.0.1");
      const limitDetail = {
        ttl: 60_000,
        limit: 100,
        key: "test-key",
        tracker: "ip:10.0.0.1",
        totalHits: 101,
        timeToExpire: 60_000,
      };

      await (guard as any).throwThrottlingException(context, limitDetail);

      const res = context.switchToHttp().getResponse();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "https://docs.tambo.co/reference/problems/rate-limit",
          status: 429,
          title: "Too Many Requests",
        }),
      );
    });

    it("should set Retry-After header", async () => {
      const context = createMockContext();
      const limitDetail = {
        ttl: 45_000,
        limit: 10,
        key: "test-key",
        tracker: "test",
        totalHits: 11,
        timeToExpire: 45_000,
      };

      await (guard as any).throwThrottlingException(context, limitDetail);

      const res = context.switchToHttp().getResponse();
      expect(res.setHeader).toHaveBeenCalledWith("Retry-After", 45);
    });

    it("should set rate limit headers on 429 response", async () => {
      const context = createMockContext();
      const limitDetail = {
        ttl: 60_000,
        limit: 20,
        key: "test-key",
        tracker: "test",
        totalHits: 21,
        timeToExpire: 60_000,
      };

      await (guard as any).throwThrottlingException(context, limitDetail);

      const res = context.switchToHttp().getResponse();
      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 20);
      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", 0);
      expect(res.setHeader).toHaveBeenCalledWith(
        "X-RateLimit-Reset",
        expect.any(String),
      );
    });

    it("should not send response if headers already sent", async () => {
      const context = createMockContext();
      const res = context.switchToHttp().getResponse();
      (res).headersSent = true;

      const limitDetail = {
        ttl: 60_000,
        limit: 100,
        key: "test",
        tracker: "test",
        totalHits: 101,
        timeToExpire: 60_000,
      };

      await (guard as any).throwThrottlingException(context, limitDetail);

      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("handleRequest", () => {
    it("should set rate limit headers on successful requests", async () => {
      const context = createMockContext();

      // Mock super.handleRequest to return true (request allowed)
      const superHandleRequest = jest
        .spyOn(
          Object.getPrototypeOf(Object.getPrototypeOf(guard)),
          "handleRequest",
        )
        .mockResolvedValue(true);

      const requestProps = {
        context,
        limit: 100,
        ttl: 60_000,
        throttler: { name: "default", limit: 100, ttl: 60_000 },
        blockDuration: 0,
        getTracker: jest.fn(),
        generateKey: jest.fn(),
      };

      const result = await (guard as any).handleRequest(requestProps);

      expect(result).toBe(true);
      const res = context.switchToHttp().getResponse();
      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 100);
      expect(res.setHeader).toHaveBeenCalledWith(
        "X-RateLimit-Reset",
        expect.any(String),
      );

      superHandleRequest.mockRestore();
    });

    it("should not set headers if response headers already sent", async () => {
      const context = createMockContext();
      const res = context.switchToHttp().getResponse();
      (res).headersSent = true;

      const superHandleRequest = jest
        .spyOn(
          Object.getPrototypeOf(Object.getPrototypeOf(guard)),
          "handleRequest",
        )
        .mockResolvedValue(true);

      const requestProps = {
        context,
        limit: 100,
        ttl: 60_000,
        throttler: { name: "default", limit: 100, ttl: 60_000 },
        blockDuration: 0,
        getTracker: jest.fn(),
        generateKey: jest.fn(),
      };

      await (guard as any).handleRequest(requestProps);

      expect(res.setHeader).not.toHaveBeenCalledWith(
        "X-RateLimit-Limit",
        expect.anything(),
      );

      superHandleRequest.mockRestore();
    });
  });
});
