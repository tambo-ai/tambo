import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { HttpExceptionFilter } from "./http-exception.filter";

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

describe("HttpExceptionFilter", () => {
  const filter = new HttpExceptionFilter();
  const req: Partial<Request> = { url: "/v1/threads" };

  it("should return problem details for BadRequestException", () => {
    const res = createMockResponse();
    const host = createMockHost(req, res);

    filter.catch(new BadRequestException("invalid input"), host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.header).toHaveBeenCalledWith(
      "Content-Type",
      "application/problem+json",
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        title: "Bad Request",
        detail: "invalid input",
        instance: "/v1/threads",
      }),
    );
  });

  it("should return problem details for NotFoundException", () => {
    const res = createMockResponse();
    const host = createMockHost(req, res);

    filter.catch(new NotFoundException("thread not found"), host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 404,
        title: "Not Found",
      }),
    );
  });

  it("should return problem details for InternalServerErrorException", () => {
    const res = createMockResponse();
    const host = createMockHost(req, res);

    filter.catch(new InternalServerErrorException("boom"), host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 500,
        title: "Internal Server Error",
      }),
    );
  });

  it("should pass through a ProblemDetails response unchanged", () => {
    const res = createMockResponse();
    const host = createMockHost(req, res);
    const problemDetails = {
      type: "https://example.com/problem",
      status: 422,
      title: "Validation Error",
      detail: "field x is invalid",
    };
    const exception = new BadRequestException(problemDetails);

    filter.catch(exception, host);

    expect(res.json).toHaveBeenCalledWith(problemDetails);
  });

  it("should not send a response when headers have already been sent", () => {
    const res = createMockResponse(true);
    const host = createMockHost(req, res);

    filter.catch(new BadRequestException("too late"), host);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.header).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
