import { Request, Response } from "express";
import { SdkVersion, SdkVersionMiddleware } from "./sdk-version.middleware";

describe("SdkVersionMiddleware", () => {
  let middleware: SdkVersionMiddleware;

  beforeEach(() => {
    middleware = new SdkVersionMiddleware();
  });

  it("should set SdkVersion on request when x-tambo-react-version header is present", () => {
    const request = {
      get: jest.fn().mockReturnValue("1.2.3"),
    } as unknown as Request;
    const response = {} as Response;
    const next = jest.fn();

    middleware.use(request, response, next);

    expect(request[SdkVersion]).toBe("1.2.3");
    expect(next).toHaveBeenCalled();
  });

  it("should not set SdkVersion on request when header is absent", () => {
    const request = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as Request;
    const response = {} as Response;
    const next = jest.fn();

    middleware.use(request, response, next);

    expect(request[SdkVersion]).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it("should not set SdkVersion on request when header is empty string", () => {
    const request = {
      get: jest.fn().mockReturnValue(""),
    } as unknown as Request;
    const response = {} as Response;
    const next = jest.fn();

    middleware.use(request, response, next);

    expect(request[SdkVersion]).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it("should read the correct header name", () => {
    const request = {
      get: jest.fn().mockReturnValue("2.0.0"),
    } as unknown as Request;
    const response = {} as Response;
    const next = jest.fn();

    middleware.use(request, response, next);

    expect(request.get).toHaveBeenCalledWith("x-tambo-react-version");
  });
});
