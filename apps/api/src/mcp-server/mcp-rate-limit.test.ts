import { Request, Response } from "express";
import { createMcpRateLimitMiddleware } from "./mcp-rate-limit";

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
  });

  it("keeps separate source address buckets", () => {
    const middleware = createMcpRateLimitMiddleware(1);
    const next = jest.fn();

    middleware(createRequest("10.0.0.1"), createResponse(), next);
    middleware(createRequest("10.0.0.2"), createResponse(), next);

    expect(next).toHaveBeenCalledTimes(2);
  });
});
