import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createDebouncedCallback } from "./debounce.js";

describe("createDebouncedCallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should delay function execution", () => {
    const fn = vi.fn();
    const debounced = createDebouncedCallback(fn, 100);

    debounced("arg1", "arg2");
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledWith("arg1", "arg2");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should only execute the last call when called multiple times", () => {
    const fn = vi.fn();
    const debounced = createDebouncedCallback(fn, 100);

    debounced("first");
    vi.advanceTimersByTime(50);
    debounced("second");
    vi.advanceTimersByTime(50);
    debounced("third");

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("third");
  });

  it("should flush pending call immediately", () => {
    const fn = vi.fn();
    const debounced = createDebouncedCallback(fn, 100);

    debounced("test");
    expect(fn).not.toHaveBeenCalled();

    debounced.flush();
    expect(fn).toHaveBeenCalledWith("test");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should not execute anything if flush is called with no pending call", () => {
    const fn = vi.fn();
    const debounced = createDebouncedCallback(fn, 100);

    debounced.flush();
    expect(fn).not.toHaveBeenCalled();
  });

  it("should cancel pending call", () => {
    const fn = vi.fn();
    const debounced = createDebouncedCallback(fn, 100);

    debounced("test");
    debounced.cancel();

    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });

  it("should not flush after cancel", () => {
    const fn = vi.fn();
    const debounced = createDebouncedCallback(fn, 100);

    debounced("test");
    debounced.cancel();
    debounced.flush();

    expect(fn).not.toHaveBeenCalled();
  });

  it("should work with async functions", async () => {
    const fn = vi.fn().mockResolvedValue("result");
    const debounced = createDebouncedCallback(fn, 100);

    debounced("async-arg");
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith("async-arg");
  });
});
