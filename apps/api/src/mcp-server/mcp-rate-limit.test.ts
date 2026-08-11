import { Request, Response } from "express";
import {
  createMcpIpRateLimitMiddleware,
  createMcpRateLimitMiddleware,
} from "./mcp-rate-limit";

function createRequest(ip: string, headers: Record<string, string> = {}) {
  return {
    ip,
    headers,
    socket: { remoteAddress: ip },
    originalUrl: "/mcp",
    url: "/mcp",
  } as unknown as Request;
}

function createResponse() {
  return {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    type: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
}

describe("createMcpRateLimitMiddleware", () => {
  it("uses the source address instead of a rotatable API key", () => {
    const middleware = createMcpRateLimitMiddleware(1);
    const next = jest.fn();
    const firstResponse = createResponse();
    const secondResponse = createResponse();

    middleware(
      createRequest("10.0.0.1", { "x-api-key": "first" }),
      firstResponse,
      next,
    );
    middleware(
      createRequest("10.0.0.1", { "x-api-key": "second" }),
      secondResponse,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(secondResponse.status).toHaveBeenCalledWith(429);
    expect(secondResponse.type).toHaveBeenCalledWith(
      "application/problem+json",
    );
    middleware.dispose();
  });

  it("keeps separate source address buckets", () => {
    const middleware = createMcpRateLimitMiddleware(1);
    const next = jest.fn();

    middleware(createRequest("10.0.0.1"), createResponse(), next);
    middleware(createRequest("10.0.0.2"), createResponse(), next);

    expect(next).toHaveBeenCalledTimes(2);
    middleware.dispose();
  });

  it("allows a source again after the window expires", () => {
    jest.useFakeTimers();
    try {
      const middleware = createMcpRateLimitMiddleware(1);
      const next = jest.fn();

      middleware(createRequest("10.0.0.1"), createResponse(), next);
      middleware(createRequest("10.0.0.1"), createResponse(), next);
      jest.advanceTimersByTime(60_001);
      middleware(createRequest("10.0.0.1"), createResponse(), next);

      expect(next).toHaveBeenCalledTimes(2);
      middleware.dispose();
    } finally {
      jest.useRealTimers();
    }
  });

  it("uses an overflow bucket when the store reaches its cap", () => {
    const middleware = createMcpRateLimitMiddleware(1);
    const next = jest.fn();

    for (let index = 0; index <= 10_000; index++) {
      const thirdOctet = Math.floor(index / 256);
      const fourthOctet = index % 256;
      middleware(
        createRequest(`192.0.${thirdOctet}.${fourthOctet}`),
        createResponse(),
        next,
      );
    }
    const blockedResponse = createResponse();
    middleware(createRequest("192.0.0.0"), blockedResponse, next);

    expect(next).toHaveBeenCalledTimes(10_001);
    expect(blockedResponse.status).toHaveBeenCalledWith(429);
    middleware.dispose();
  });

  it("routes new IPs into overflow once the IP store is full", () => {
    const middleware = createMcpIpRateLimitMiddleware(1);
    const next = jest.fn();

    for (let index = 0; index < 10_000; index++) {
      const thirdOctet = Math.floor(index / 256);
      const fourthOctet = index % 256;
      middleware(
        createRequest(`192.0.${thirdOctet}.${fourthOctet}`),
        createResponse(),
        next,
      );
    }

    const firstOverflowResponse = createResponse();
    middleware(createRequest("193.0.0.1"), firstOverflowResponse, next);
    expect(firstOverflowResponse.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(10_001);

    const secondOverflowResponse = createResponse();
    middleware(createRequest("193.0.0.2"), secondOverflowResponse, next);
    expect(secondOverflowResponse.status).toHaveBeenCalledWith(429);
    expect(secondOverflowResponse.type).toHaveBeenCalledWith(
      "application/problem+json",
    );
    middleware.dispose();
  });
});
