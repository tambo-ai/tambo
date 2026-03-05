import { ArgumentsHost, HttpStatus } from "@nestjs/common";
import {
  DomainError,
  DomainErrorKind,
  InputValidationError,
  NotFoundError,
} from "@tambo-ai-cloud/core";
import { Request, Response } from "express";
import { DomainExceptionFilter } from "./domain-exception.filter";

function createMockHost(req: Partial<Request>, res: Partial<Response>) {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as unknown as ArgumentsHost;
}

function createMockResponse() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.header = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as jest.Mocked<Pick<Response, "status" | "header" | "json">> &
    Partial<Response>;
}

describe("DomainExceptionFilter", () => {
  const filter = new DomainExceptionFilter();
  const req: Partial<Request> = {
    originalUrl: "/v1/threads/runs?userKey=test",
  };

  it("should return 400 for InputValidationError", () => {
    const res = createMockResponse();
    const host = createMockHost(req, res);
    const error = new InputValidationError(
      "Project does not allow overriding the system prompt with initial messages",
    );

    filter.catch(error, host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.header).toHaveBeenCalledWith(
      "Content-Type",
      "application/problem+json",
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        title: "Bad Request",
        detail:
          "Project does not allow overriding the system prompt with initial messages",
      }),
    );
  });

  it("should return 404 for NotFoundError", () => {
    const res = createMockResponse();
    const host = createMockHost(req, res);
    const error = new NotFoundError("Project with ID abc not found");

    filter.catch(error, host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 404,
        title: "Not Found",
        detail: "Project with ID abc not found",
      }),
    );
  });

  it.each<{ kind: DomainErrorKind; expectedStatus: number }>([
    { kind: "validation", expectedStatus: HttpStatus.BAD_REQUEST },
    { kind: "not-found", expectedStatus: HttpStatus.NOT_FOUND },
    { kind: "conflict", expectedStatus: HttpStatus.CONFLICT },
    { kind: "forbidden", expectedStatus: HttpStatus.FORBIDDEN },
  ])(
    "should return $expectedStatus for $kind DomainError",
    ({ kind, expectedStatus }) => {
      const res = createMockResponse();
      const host = createMockHost(req, res);
      const error = new DomainError(kind, `Test ${kind} error`);

      filter.catch(error, host);

      expect(res.status).toHaveBeenCalledWith(expectedStatus);
      expect(res.header).toHaveBeenCalledWith(
        "Content-Type",
        "application/problem+json",
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: expectedStatus,
          detail: `Test ${kind} error`,
          instance: "/v1/threads/runs?userKey=test",
        }),
      );
    },
  );

  it("should use request.url as fallback when originalUrl is undefined", () => {
    const res = createMockResponse();
    const fallbackReq: Partial<Request> = {
      originalUrl: undefined as unknown as string,
      url: "/fallback-url",
    };
    const host = createMockHost(fallbackReq, res);
    const error = new InputValidationError("test");

    filter.catch(error, host);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ instance: "/fallback-url" }),
    );
  });
});
