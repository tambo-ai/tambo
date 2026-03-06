import { retryWithBackoff } from "./retry";

describe("retryWithBackoff", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should return immediately when operation succeeds on first try", async () => {
    const operation = jest.fn().mockResolvedValue("success");

    const promise = retryWithBackoff(operation, {
      maxRetries: 3,
      initialDelayMs: 100,
      backoffMultiplier: 2,
    });

    const result = await promise;

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("should retry and succeed after initial failures", async () => {
    const operation = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue("success");

    const promise = retryWithBackoff(operation, {
      maxRetries: 5,
      initialDelayMs: 50,
      backoffMultiplier: 1.5,
    });

    // First attempt returns undefined, triggers delay
    await jest.advanceTimersByTimeAsync(50);
    // Second attempt returns undefined, triggers delay
    await jest.advanceTimersByTimeAsync(75);
    // Third attempt succeeds

    const result = await promise;

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("should return undefined after exhausting all retries", async () => {
    const operation = jest.fn().mockResolvedValue(undefined);

    const promise = retryWithBackoff(operation, {
      maxRetries: 2,
      initialDelayMs: 50,
      backoffMultiplier: 2,
    });

    // First attempt, then delay
    await jest.advanceTimersByTimeAsync(50);
    // Second attempt, then delay
    await jest.advanceTimersByTimeAsync(100);
    // Third attempt (final), no more delay

    const result = await promise;

    expect(result).toBeUndefined();
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("should apply exponential backoff between retries", async () => {
    const operation = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue("success");

    const setTimeoutSpy = jest.spyOn(global, "setTimeout");

    const promise = retryWithBackoff(operation, {
      maxRetries: 5,
      initialDelayMs: 100,
      backoffMultiplier: 2,
    });

    await jest.advanceTimersByTimeAsync(100);
    await jest.advanceTimersByTimeAsync(200);
    await jest.advanceTimersByTimeAsync(400);

    await promise;

    const delays = setTimeoutSpy.mock.calls
      .filter(([, ms]) => typeof ms === "number" && ms >= 100)
      .map(([, ms]) => ms);

    expect(delays).toEqual([100, 200, 400]);

    setTimeoutSpy.mockRestore();
  });
});
