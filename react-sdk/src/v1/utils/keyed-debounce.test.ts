import { createKeyedDebounce } from "./keyed-debounce";

describe("createKeyedDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("fires immediately on first call (leading edge)", () => {
    const fn = jest.fn();
    const throttle = createKeyedDebounce(fn, 100);

    throttle.schedule("a", 1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a", 1);
  });

  it("does not fire again during cooldown window", () => {
    const fn = jest.fn();
    const throttle = createKeyedDebounce(fn, 100);

    throttle.schedule("a", 1);
    throttle.schedule("a", 2);
    throttle.schedule("a", 3);

    // Only the leading call should have fired
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a", 1);
  });

  it("fires trailing call with latest value after cooldown", () => {
    const fn = jest.fn();
    const throttle = createKeyedDebounce(fn, 100);

    throttle.schedule("a", 1); // leading fire
    throttle.schedule("a", 2);
    throttle.schedule("a", 3);

    jest.advanceTimersByTime(100);

    // Trailing fire with latest value
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith("a", 3);
  });

  it("does not fire trailing call if no new values arrived", () => {
    const fn = jest.fn();
    const throttle = createKeyedDebounce(fn, 100);

    throttle.schedule("a", 1); // leading fire

    jest.advanceTimersByTime(100);

    // No trailing fire — only the leading call
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("fires periodically during continuous rapid calls", () => {
    const fn = jest.fn();
    const throttle = createKeyedDebounce(fn, 100);

    // Simulate rapid streaming chunks every 30ms for 350ms
    throttle.schedule("a", 1); // t=0, leading fire
    jest.advanceTimersByTime(30);
    throttle.schedule("a", 2); // t=30
    jest.advanceTimersByTime(30);
    throttle.schedule("a", 3); // t=60
    jest.advanceTimersByTime(30);
    throttle.schedule("a", 4); // t=90
    jest.advanceTimersByTime(10);
    // t=100: cooldown expires, trailing fires with value 4
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith("a", 4);

    jest.advanceTimersByTime(20);
    throttle.schedule("a", 5); // t=120
    jest.advanceTimersByTime(30);
    throttle.schedule("a", 6); // t=150
    jest.advanceTimersByTime(30);
    throttle.schedule("a", 7); // t=180
    jest.advanceTimersByTime(20);
    // t=200: second cooldown expires, trailing fires with value 7
    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn).toHaveBeenLastCalledWith("a", 7);
  });

  it("tracks keys independently", () => {
    const fn = jest.fn();
    const throttle = createKeyedDebounce(fn, 100);

    throttle.schedule("a", 1); // leading fire for "a"
    jest.advanceTimersByTime(50);
    throttle.schedule("b", 2); // leading fire for "b"

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith("a", 1);
    expect(fn).toHaveBeenCalledWith("b", 2);
  });

  it("tracks keys independently with trailing calls", () => {
    const fn = jest.fn();
    const throttle = createKeyedDebounce(fn, 100);

    throttle.schedule("a", 1); // leading fire for "a"
    throttle.schedule("a", 2); // queued trailing for "a"
    jest.advanceTimersByTime(50);
    throttle.schedule("b", 3); // leading fire for "b"
    throttle.schedule("b", 4); // queued trailing for "b"

    expect(fn).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(50);
    // t=100: "a" trailing fires
    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn).toHaveBeenCalledWith("a", 2);

    jest.advanceTimersByTime(50);
    // t=150: "b" trailing fires
    expect(fn).toHaveBeenCalledTimes(4);
    expect(fn).toHaveBeenCalledWith("b", 4);
  });

  it("flush() fires all pending trailing calls immediately", () => {
    const fn = jest.fn();
    const throttle = createKeyedDebounce(fn, 100);

    throttle.schedule("a", 1); // leading fire
    throttle.schedule("a", 2); // queued trailing
    throttle.schedule("b", 3); // leading fire
    throttle.schedule("b", 4); // queued trailing

    expect(fn).toHaveBeenCalledTimes(2); // two leading fires

    throttle.flush();

    expect(fn).toHaveBeenCalledTimes(4); // two trailing fires
    expect(fn).toHaveBeenCalledWith("a", 2);
    expect(fn).toHaveBeenCalledWith("b", 4);

    // Timers should be cancelled — no double-fire
    jest.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it("flush() is a no-op when nothing is pending", () => {
    const fn = jest.fn();
    const throttle = createKeyedDebounce(fn, 100);

    throttle.flush();
    expect(fn).not.toHaveBeenCalled();
  });

  it("flush() skips keys with no trailing value", () => {
    const fn = jest.fn();
    const throttle = createKeyedDebounce(fn, 100);

    throttle.schedule("a", 1); // leading fire, no trailing queued

    expect(fn).toHaveBeenCalledTimes(1);

    throttle.flush();

    // No trailing to fire — still just the one leading call
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("becomes idle after trailing fire with no new calls", () => {
    const fn = jest.fn();
    const throttle = createKeyedDebounce(fn, 100);

    throttle.schedule("a", 1); // leading
    throttle.schedule("a", 2); // trailing queued

    jest.advanceTimersByTime(100); // trailing fires
    expect(fn).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(100); // cooldown after trailing — no new calls
    expect(fn).toHaveBeenCalledTimes(2); // no extra fires

    // New call should fire immediately (leading again)
    throttle.schedule("a", 3);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn).toHaveBeenLastCalledWith("a", 3);
  });
});
