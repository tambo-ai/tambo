/**
 * Tests for retry logic
 */

import { fetchWithRetry } from "./retry";
import { APIError } from "@tambo-ai/typescript-sdk";

function makeApiError(status: number, message: string): APIError {
  return new APIError(status, { message }, message, new Headers());
}

describe("fetchWithRetry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should retry on network error (TypeError)", async () => {
    const mockFn = jest.fn();
    let attemptCount = 0;

    mockFn.mockImplementation(async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new TypeError("Network error");
      }
      return await Promise.resolve("success");
    });

    const result = await fetchWithRetry(mockFn, {
      numOfAttempts: 3,
      startingDelay: 1,
      maxDelay: 10,
    });

    expect(result).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it("should retry on 500 status", async () => {
    const mockFn = jest.fn();
    let attemptCount = 0;

    mockFn.mockImplementation(async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw makeApiError(500, "Server error");
      }
      return await Promise.resolve("success");
    });

    const result = await fetchWithRetry(mockFn, {
      numOfAttempts: 3,
      startingDelay: 1,
      maxDelay: 10,
    });

    expect(result).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it("should NOT retry on 400 status", async () => {
    const mockFn = jest.fn();

    mockFn.mockImplementation(() => {
      throw makeApiError(400, "Bad request");
    });

    await expect(
      fetchWithRetry(mockFn, {
        numOfAttempts: 3,
        startingDelay: 1,
        maxDelay: 10,
      }),
    ).rejects.toThrow(APIError);

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("should NOT retry on 404 status", async () => {
    const mockFn = jest.fn();

    mockFn.mockImplementation(() => {
      throw makeApiError(404, "Not found");
    });

    await expect(
      fetchWithRetry(mockFn, {
        numOfAttempts: 3,
        startingDelay: 1,
        maxDelay: 10,
      }),
    ).rejects.toThrow(APIError);

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("should respect maxRetries limit", async () => {
    const mockFn = jest.fn();

    mockFn.mockImplementation(() => {
      throw new TypeError("Network error");
    });

    await expect(
      fetchWithRetry(mockFn, {
        numOfAttempts: 2,
        startingDelay: 1,
        maxDelay: 10,
      }),
    ).rejects.toThrow(TypeError);

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("should succeed on first attempt if no error", async () => {
    const mockFn = jest.fn().mockResolvedValue("success");

    const result = await fetchWithRetry(mockFn, {
      numOfAttempts: 3,
      startingDelay: 1,
      maxDelay: 10,
    });

    expect(result).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
