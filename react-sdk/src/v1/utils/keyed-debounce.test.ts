import { createKeyedDebounce } from "./keyed-debounce";

describe("createKeyedDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("fires callback after delay", () => {
    const fn = jest.fn();
    const debounce = createKeyedDebounce(fn, 100);

    debounce.schedule("a", 1);
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith("a", 1);
  });

  it("resets timer on repeated calls for the same key", () => {
    const fn = jest.fn();
    const debounce = createKeyedDebounce(fn, 100);

    debounce.schedule("a", 1);
    jest.advanceTimersByTime(80);
    debounce.schedule("a", 2);
    jest.advanceTimersByTime(80);

    // First timer (100ms from first call) should NOT have fired
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(20);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a", 2);
  });

  it("tracks keys independently", () => {
    const fn = jest.fn();
    const debounce = createKeyedDebounce(fn, 100);

    debounce.schedule("a", 1);
    jest.advanceTimersByTime(50);
    debounce.schedule("b", 2);
    jest.advanceTimersByTime(50);

    // "a" has waited 100ms, "b" only 50ms
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a", 1);

    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith("b", 2);
  });

  it("flush() fires all pending calls immediately", () => {
    const fn = jest.fn();
    const debounce = createKeyedDebounce(fn, 100);

    debounce.schedule("a", 1);
    debounce.schedule("b", 2);
    debounce.flush();

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith("a", 1);
    expect(fn).toHaveBeenCalledWith("b", 2);

    // Timers should be cancelled — no double-fire
    jest.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("flush() is a no-op when nothing is pending", () => {
    const fn = jest.fn();
    const debounce = createKeyedDebounce(fn, 100);

    debounce.flush();
    expect(fn).not.toHaveBeenCalled();
  });
});
