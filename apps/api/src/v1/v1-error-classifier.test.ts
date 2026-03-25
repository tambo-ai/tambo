import { APICallError } from "@ai-sdk/provider";
import { HttpException, HttpStatus, NotFoundException } from "@nestjs/common";
import { classifyStreamingError } from "./v1-error-classifier";

describe("classifyStreamingError", () => {
  describe("APICallError classification", () => {
    function makeApiCallError(
      statusCode: number | undefined,
      message: string,
    ): APICallError {
      return new APICallError({
        message,
        url: "https://api.openai.com/v1/chat/completions",
        requestBodyValues: {},
        statusCode,
        isRetryable: statusCode === 429 || (statusCode ?? 0) >= 500,
      });
    }

    it("classifies 400 as client_error, not retryable", () => {
      const error = makeApiCallError(400, "Bad request");
      const result = classifyStreamingError(error);

      expect(result.category).toBe("client_error");
      expect(result.code).toBe("LLM_CLIENT_ERROR");
      expect(result.isRetryable).toBe(false);
      expect(result.message).toBe("Bad request");
      expect(result.status).toBe(400);
    });

    it("classifies 401 as client_error with the provider message", () => {
      const error = makeApiCallError(
        401,
        "You do not have access to the organization tied to the API key.",
      );
      const result = classifyStreamingError(error);

      expect(result.category).toBe("client_error");
      expect(result.code).toBe("LLM_CLIENT_ERROR");
      expect(result.isRetryable).toBe(false);
      expect(result.message).toBe(
        "You do not have access to the organization tied to the API key.",
      );
    });

    it("classifies 403 as client_error", () => {
      const result = classifyStreamingError(makeApiCallError(403, "Forbidden"));

      expect(result.category).toBe("client_error");
      expect(result.isRetryable).toBe(false);
    });

    it("classifies 429 as client_error but retryable", () => {
      const result = classifyStreamingError(
        makeApiCallError(429, "Rate limit exceeded"),
      );

      expect(result.category).toBe("client_error");
      expect(result.code).toBe("LLM_CLIENT_ERROR");
      expect(result.isRetryable).toBe(true);
      expect(result.message).toBe("Rate limit exceeded");
      expect(result.status).toBe(429);
    });

    it("classifies 500 as server_error, retryable, with generic message", () => {
      const result = classifyStreamingError(
        makeApiCallError(500, "Internal server error details here"),
      );

      expect(result.category).toBe("server_error");
      expect(result.code).toBe("LLM_SERVER_ERROR");
      expect(result.isRetryable).toBe(true);
      expect(result.message).toBe(
        "The AI provider encountered a temporary error",
      );
      expect(result.status).toBe(500);
    });

    it("classifies 503 as server_error, retryable", () => {
      const result = classifyStreamingError(
        makeApiCallError(503, "Service unavailable"),
      );

      expect(result.category).toBe("server_error");
      expect(result.code).toBe("LLM_SERVER_ERROR");
      expect(result.isRetryable).toBe(true);
    });

    it("classifies undefined statusCode as server_error, not retryable, no status", () => {
      const result = classifyStreamingError(
        makeApiCallError(undefined, "Network error"),
      );

      expect(result.category).toBe("server_error");
      expect(result.code).toBe("LLM_ERROR");
      expect(result.isRetryable).toBe(false);
      expect(result.message).toBe(
        "An error occurred communicating with the AI provider",
      );
      expect(result.status).toBeUndefined();
    });
  });

  describe("HttpException classification", () => {
    it("classifies 400 HttpException as client_error", () => {
      const error = new HttpException("Bad request", HttpStatus.BAD_REQUEST);
      const result = classifyStreamingError(error);

      expect(result.category).toBe("client_error");
      expect(result.isRetryable).toBe(false);
    });

    it("classifies NotFoundException as client_error", () => {
      const error = new NotFoundException("Thread not found");
      const result = classifyStreamingError(error);

      expect(result.category).toBe("client_error");
      expect(result.isRetryable).toBe(false);
    });

    it("classifies 500 HttpException as server_error", () => {
      const error = new HttpException(
        "Internal server error",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      const result = classifyStreamingError(error);

      expect(result.category).toBe("server_error");
      expect(result.code).toBe("INTERNAL_ERROR");
      expect(result.isRetryable).toBe(false);
      expect(result.status).toBe(500);
    });

    it("extracts code from ProblemDetail-shaped response", () => {
      const error = new HttpException(
        {
          type: "urn:tambo:error:concurrent_run",
          title: "Concurrent Run",
          status: 409,
          detail: "A run is already active on this thread",
        },
        HttpStatus.CONFLICT,
      );
      const result = classifyStreamingError(error);

      expect(result.category).toBe("client_error");
      expect(result.code).toBe("CONCURRENT_RUN");
      expect(result.message).toBe("A run is already active on this thread");
    });
  });

  describe("fallback classification", () => {
    it("classifies plain Error as server_error with status 500", () => {
      const result = classifyStreamingError(new Error("something broke"));

      expect(result.category).toBe("server_error");
      expect(result.code).toBe("INTERNAL_ERROR");
      expect(result.isRetryable).toBe(false);
      expect(result.message).toBe("An internal error occurred");
      expect(result.status).toBe(500);
    });

    it("classifies string as server_error", () => {
      const result = classifyStreamingError("some string error");

      expect(result.category).toBe("server_error");
      expect(result.code).toBe("INTERNAL_ERROR");
      expect(result.isRetryable).toBe(false);
    });

    it("classifies null as server_error", () => {
      const result = classifyStreamingError(null);

      expect(result.category).toBe("server_error");
      expect(result.code).toBe("INTERNAL_ERROR");
    });
  });
});
