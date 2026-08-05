import { ExecutionContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { ThrottlerModuleOptions, ThrottlerStorage } from "@nestjs/throttler";
import { encryptApiKey } from "@tambo-ai-cloud/core";
import { Request, Response } from "express";
import { RateLimitException } from "../../threads/types/errors";
import { RateLimitGuard } from "./rate-limit.guard";

type GuardInternals = {
  getTracker: (request: Request) => Promise<string>;
  getRequestResponse: (context: ExecutionContext) => {
    req: Record<string, unknown>;
    res: Record<string, unknown>;
  };
  throwThrottlingException: (
    context: ExecutionContext,
    detail: {
      limit: number;
      key: string;
      tracker: string;
      totalHits: number;
      timeToExpire: number;
      timeToBlockExpire: number;
    },
  ) => never;
};

function getInternals(guard: RateLimitGuard): GuardInternals {
  return guard as unknown as GuardInternals;
}

function createMockContext(
  headers: Record<string, string | string[]> = {},
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
    throttlers: [{ name: "default", limit: 100, ttl: 60_000 }],
  };
  const storage: ThrottlerStorage = {
    increment: jest.fn().mockResolvedValue({
      totalHits: 1,
      timeToExpire: 60,
      timeToExpireFromFirst: 60,
      isBlocked: false,
      blockDuration: 0,
      blockedStatuses: [],
    }),
  };
  const configService = {
    get: jest.fn().mockReturnValue("invalid-test-secret"),
  } as unknown as ConfigService;
  return new RateLimitGuard(options, storage, new Reflector(), configService);
}

describe("RateLimitGuard", () => {
  let guard: RateLimitGuard;

  beforeEach(() => {
    guard = createGuard();
  });

  it("uses the source address even when an API key is supplied", async () => {
    const context = createMockContext(
      { "x-api-key": "rotatable-untrusted-value" },
      "192.168.1.100",
    );
    const request = context.switchToHttp().getRequest();

    await expect(getInternals(guard).getTracker(request)).resolves.toBe(
      "ip:192.168.1.100",
    );
  });

  it("uses the project ID from a cryptographically valid API key", async () => {
    const encryptedApiKey = encryptApiKey(
      "proj_123",
      "api-key-value",
      "invalid-test-secret",
    );
    const context = createMockContext({ "x-api-key": encryptedApiKey });
    const request = context.switchToHttp().getRequest();

    await expect(getInternals(guard).getTracker(request)).resolves.toBe(
      "project:proj_123",
    );
  });

  it("falls back to unknown when the source address is unavailable", async () => {
    const context = createMockContext();
    const request = context.switchToHttp().getRequest();
    Object.defineProperty(request, "ip", { value: undefined });
    Object.defineProperty(request.socket, "remoteAddress", {
      value: undefined,
    });

    await expect(getInternals(guard).getTracker(request)).resolves.toBe(
      "ip:unknown",
    );
  });

  it("extracts request and response from the execution context", () => {
    const context = createMockContext();
    const result = getInternals(guard).getRequestResponse(context);

    expect(result.req).toBe(context.switchToHttp().getRequest());
    expect(result.res).toBe(context.switchToHttp().getResponse());
  });

  it("throws a typed 429 with Problem Details", () => {
    const context = createMockContext({}, "10.0.0.1");
    const detail = {
      limit: 100,
      key: "test-key",
      tracker: "ip:10.0.0.1",
      totalHits: 101,
      timeToExpire: 12,
      timeToBlockExpire: 12,
    };

    expect(() =>
      getInternals(guard).throwThrottlingException(context, detail),
    ).toThrow(RateLimitException);

    const response = context.switchToHttp().getResponse();
    expect(response.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/problem+json",
    );
    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", 12);
    expect(response.setHeader).toHaveBeenCalledWith("X-RateLimit-Reset", 12);
  });

  it("uses the remaining block duration for Retry-After", () => {
    const context = createMockContext();
    const detail = {
      limit: 10,
      key: "test-key",
      tracker: "ip:test",
      totalHits: 11,
      timeToExpire: 45,
      timeToBlockExpire: 3,
    };

    expect(() =>
      getInternals(guard).throwThrottlingException(context, detail),
    ).toThrow(RateLimitException);

    expect(context.switchToHttp().getResponse().setHeader).toHaveBeenCalledWith(
      "Retry-After",
      3,
    );
  });
});
