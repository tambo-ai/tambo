import { ArgumentsHost, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import { RateLimitException } from "../../threads/types/errors";
import { RateLimitExceptionFilter } from "./rate-limit-exception.filter";

function createMockHost(req: Partial<Request>, res: Partial<Response>) {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as unknown as ArgumentsHost;
}

function createMockResponse(headersSent = false) {
  const res: Partial<Response> = { headersSent };
  res.status = jest.fn().mockReturnValue(res);
  res.header = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as jest.Mocked<Pick<Response, "status" | "header" | "json">> &
    Partial<Response>;
}

describe("RateLimitExceptionFilter", () => {
  const filter = new RateLimitExceptionFilter();
  const req: Partial<Request> = {
    originalUrl: "/v1/threads/runs",
  };

  it("should format RateLimitException with application/problem+json", () => {
    const res = createMockResponse();
    const host = createMockHost(req, res);
    const problemDetails = {
      type: "https://docs.tambo.co/reference/problems/rate-limit",
      status: 429,
      title: "Too Many Requests",
      detail: "Rate limit exceeded. Try again in 60 seconds.",
      instance: "/v1/threads/runs",
    };
    const exception = new RateLimitException(problemDetails);

    filter.catch(exception, host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    expect(res.header).toHaveBeenCalledWith(
      "Content-Type",
      "application/problem+json",
    );
    expect(res.json).toHaveBeenCalledWith(problemDetails);
  });

  it("should do nothing if headers are already sent", () => {
    const res = createMockResponse(true);
    const host = createMockHost(req, res);
    const exception = new RateLimitException({
      type: "type",
      detail: "detail",
    });

    filter.catch(exception, host);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.header).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
