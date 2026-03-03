import { renderHook } from "@testing-library/react";
import { useResize } from "./use-resize";

describe("useResize", () => {
  let rafCallbacks: FrameRequestCallback[];

  beforeEach(() => {
    rafCallbacks = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    // Set a fixed innerHeight for max height calculations
    Object.defineProperty(window, "innerHeight", {
      value: 1000,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockTarget = () => ({
    setPointerCapture: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });

  const pointerDown = (
    target: ReturnType<typeof createMockTarget>,
    clientY: number,
  ) =>
    ({
      pointerId: 1,
      clientY,
      currentTarget: target,
    }) as unknown as React.PointerEvent;

  it("returns a handlePointerDown function", () => {
    const onHeightChange = vi.fn();
    const { result } = renderHook(() =>
      useResize({ height: 350, onHeightChange }),
    );

    expect(typeof result.current.handlePointerDown).toBe("function");
  });

  it("sets up pointer capture and event listeners on pointer down", () => {
    const onHeightChange = vi.fn();
    const { result } = renderHook(() =>
      useResize({ height: 200, onHeightChange }),
    );

    const mockTarget = createMockTarget();

    result.current.handlePointerDown(pointerDown(mockTarget, 100));

    expect(mockTarget.setPointerCapture).toHaveBeenCalledWith(1);
    expect(mockTarget.addEventListener).toHaveBeenCalledWith(
      "pointermove",
      expect.any(Function),
    );
    expect(mockTarget.addEventListener).toHaveBeenCalledWith(
      "pointerup",
      expect.any(Function),
    );
  });

  it("calls onHeightChange during pointer move via rAF", () => {
    const onHeightChange = vi.fn();
    const { result } = renderHook(() =>
      useResize({ height: 300, onHeightChange }),
    );

    const mockTarget = createMockTarget();
    result.current.handlePointerDown(pointerDown(mockTarget, 500));

    // Extract the pointermove handler
    const moveHandler = mockTarget.addEventListener.mock.calls.find(
      ([event]: [string]) => event === "pointermove",
    )?.[1] as (e: PointerEvent) => void;

    // Simulate dragging up (decreasing clientY = increasing height)
    moveHandler({ clientY: 450 } as PointerEvent);

    // Flush rAF
    for (const cb of rafCallbacks) {
      cb(0);
    }

    // delta = 500 - 450 = 50, newHeight = 300 + 50 = 350
    expect(onHeightChange).toHaveBeenCalledWith(350);
  });

  it("clamps height to minimum of 150", () => {
    const onHeightChange = vi.fn();
    const { result } = renderHook(() =>
      useResize({ height: 200, onHeightChange }),
    );

    const mockTarget = createMockTarget();
    result.current.handlePointerDown(pointerDown(mockTarget, 500));

    const moveHandler = mockTarget.addEventListener.mock.calls.find(
      ([event]: [string]) => event === "pointermove",
    )?.[1] as (e: PointerEvent) => void;

    // Drag down a lot (increasing clientY = decreasing height)
    moveHandler({ clientY: 700 } as PointerEvent);

    for (const cb of rafCallbacks) {
      cb(0);
    }

    // delta = 500 - 700 = -200, raw = 200 + (-200) = 0, clamped to 150
    expect(onHeightChange).toHaveBeenCalledWith(150);
  });

  it("clamps height to max 80% of window height", () => {
    const onHeightChange = vi.fn();
    const { result } = renderHook(() =>
      useResize({ height: 700, onHeightChange }),
    );

    const mockTarget = createMockTarget();
    result.current.handlePointerDown(pointerDown(mockTarget, 500));

    const moveHandler = mockTarget.addEventListener.mock.calls.find(
      ([event]: [string]) => event === "pointermove",
    )?.[1] as (e: PointerEvent) => void;

    // Drag up a lot
    moveHandler({ clientY: 100 } as PointerEvent);

    for (const cb of rafCallbacks) {
      cb(0);
    }

    // delta = 500 - 100 = 400, raw = 700 + 400 = 1100, max = 1000 * 0.8 = 800
    expect(onHeightChange).toHaveBeenCalledWith(800);
  });

  it("cancels previous rAF when new move fires before frame", () => {
    const onHeightChange = vi.fn();
    const { result } = renderHook(() =>
      useResize({ height: 300, onHeightChange }),
    );

    const mockTarget = createMockTarget();
    result.current.handlePointerDown(pointerDown(mockTarget, 500));

    const moveHandler = mockTarget.addEventListener.mock.calls.find(
      ([event]: [string]) => event === "pointermove",
    )?.[1] as (e: PointerEvent) => void;

    // Two moves before any rAF flush
    moveHandler({ clientY: 490 } as PointerEvent);
    moveHandler({ clientY: 480 } as PointerEvent);

    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it("removes listeners and cancels rAF on pointer up", () => {
    const onHeightChange = vi.fn();
    const { result } = renderHook(() =>
      useResize({ height: 300, onHeightChange }),
    );

    const mockTarget = createMockTarget();
    result.current.handlePointerDown(pointerDown(mockTarget, 500));

    const moveHandler = mockTarget.addEventListener.mock.calls.find(
      ([event]: [string]) => event === "pointermove",
    )?.[1] as (e: PointerEvent) => void;
    const upHandler = mockTarget.addEventListener.mock.calls.find(
      ([event]: [string]) => event === "pointerup",
    )?.[1] as () => void;

    // Move to schedule a rAF
    moveHandler({ clientY: 490 } as PointerEvent);

    // Pointer up should clean up
    upHandler();

    expect(mockTarget.removeEventListener).toHaveBeenCalledWith(
      "pointermove",
      moveHandler,
    );
    expect(mockTarget.removeEventListener).toHaveBeenCalledWith(
      "pointerup",
      upHandler,
    );
  });

  it("ignores pointer move after pointer up", () => {
    const onHeightChange = vi.fn();
    const { result } = renderHook(() =>
      useResize({ height: 300, onHeightChange }),
    );

    const mockTarget = createMockTarget();
    result.current.handlePointerDown(pointerDown(mockTarget, 500));

    const moveHandler = mockTarget.addEventListener.mock.calls.find(
      ([event]: [string]) => event === "pointermove",
    )?.[1] as (e: PointerEvent) => void;
    const upHandler = mockTarget.addEventListener.mock.calls.find(
      ([event]: [string]) => event === "pointerup",
    )?.[1] as () => void;

    upHandler();
    rafCallbacks = [];

    // Move after up should be ignored (isDragging = false)
    moveHandler({ clientY: 490 } as PointerEvent);

    expect(rafCallbacks).toHaveLength(0);
    expect(onHeightChange).not.toHaveBeenCalled();
  });
});
