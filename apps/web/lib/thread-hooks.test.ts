import {
  checkHasContent,
  getSafeContent,
  hasRightClass,
  useCanvasDetection,
  useMergedRef,
  usePositioning,
} from "@/lib/thread-hooks";
import { act, renderHook } from "@testing-library/react";
import * as React from "react";

describe("thread-hooks utilities", () => {
  test("hasRightClass detects 'right' token", () => {
    expect(hasRightClass(undefined)).toBe(false);
    expect(hasRightClass("")).toBe(false);
    expect(hasRightClass("foo bar")).toBe(false);
    expect(hasRightClass("foo right bar")).toBe(true);
    expect(hasRightClass("right")).toBe(true);
  });

  test("usePositioning computes positions based on class and canvas", () => {
    // class has right
    let res = usePositioning("right", false, false);
    expect(res.isLeftPanel).toBe(false);
    expect(res.historyPosition).toBe("right");

    // canvas on left forces history right when not right class
    res = usePositioning("foo", true, true);
    expect(res.isLeftPanel).toBe(true);
    expect(res.historyPosition).toBe("right");

    // default left when no canvas and not right class
    res = usePositioning("foo", false, false);
    expect(res.isLeftPanel).toBe(true);
    expect(res.historyPosition).toBe("left");
  });

  test("usePositioning handles all combinations of history position logic", () => {
    // Test all combinations of the nested ternary: isRightClass ? "right" : hasCanvasSpace && canvasIsOnLeft ? "right" : "left"

    // Case 1: isRightClass = true (should return "right" regardless of other params)
    let res = usePositioning("right", false, false);
    expect(res.historyPosition).toBe("right");

    res = usePositioning("right", true, true);
    expect(res.historyPosition).toBe("right");

    res = usePositioning("right", false, true);
    expect(res.historyPosition).toBe("right");

    res = usePositioning("right", true, false);
    expect(res.historyPosition).toBe("right");

    // Case 2: isRightClass = false, hasCanvasSpace = true, canvasIsOnLeft = true (should return "right")
    res = usePositioning("foo", true, true);
    expect(res.historyPosition).toBe("right");

    res = usePositioning("left", true, true);
    expect(res.historyPosition).toBe("right");

    res = usePositioning("", true, true);
    expect(res.historyPosition).toBe("right");

    // Case 3: isRightClass = false, hasCanvasSpace = false (should return "left" regardless of canvasIsOnLeft)
    res = usePositioning("foo", false, false);
    expect(res.historyPosition).toBe("left");

    res = usePositioning("left", false, false);
    expect(res.historyPosition).toBe("left");

    res = usePositioning("", false, false);
    expect(res.historyPosition).toBe("left");

    // Case 4: isRightClass = false, hasCanvasSpace = true, canvasIsOnLeft = false (should return "left")
    res = usePositioning("foo", false, true);
    expect(res.historyPosition).toBe("left");

    res = usePositioning("left", false, true);
    expect(res.historyPosition).toBe("left");

    res = usePositioning("", false, true);
    expect(res.historyPosition).toBe("left");
  });

  test("getSafeContent flattens array and allows strings/elements", () => {
    expect(getSafeContent(undefined)).toBe("");
    expect(getSafeContent(null)).toBe("");
    expect(getSafeContent("hello")).toBe("hello");

    const el = React.createElement("span", null, "x");
    expect(getSafeContent(el)).toBe(el);

    const arr = [
      { type: "text", text: "Hello" },
      { type: "image", url: "x" },
      { type: "text", text: " World" },
    ] as unknown as React.ReactNode[];
    expect(getSafeContent(arr)).toBe("Hello World");

    expect(getSafeContent({} as unknown as React.ReactNode)).toBe(
      "Invalid content format",
    );
  });

  test("checkHasContent mirrors getSafeContent semantics", () => {
    expect(checkHasContent(undefined)).toBe(false);
    expect(checkHasContent(null)).toBe(false);
    expect(checkHasContent(" ")).toBe(false);
    expect(checkHasContent("x")).toBe(true);

    const el = React.createElement("div");
    expect(checkHasContent(el)).toBe(true);

    const arr = [
      { type: "text", text: "  " },
      { type: "image", url: "x" },
      { type: "text", text: "Hello" },
    ] as unknown as React.ReactNode[];
    expect(checkHasContent(arr)).toBe(true);

    const emptyArr = [
      { type: "text", text: "  " },
      { type: "image", url: "x" },
    ] as unknown as React.ReactNode[];
    expect(checkHasContent(emptyArr)).toBe(false);
  });
});

describe("useMergedRef", () => {
  test("updates both callback and object refs", () => {
    const objectRef = React.createRef<HTMLDivElement | null>();
    const calls: Array<HTMLDivElement | null> = [];
    const callbackRef = (el: HTMLDivElement | null): void => {
      calls.push(el);
    };

    const { result } = renderHook(() =>
      useMergedRef<HTMLDivElement | null>(objectRef, callbackRef),
    );

    const el = document.createElement("div");
    act(() => {
      result.current(el);
    });

    expect(objectRef.current).toBe(el);
    expect(calls.at(-1)).toBe(el);

    act(() => {
      result.current(null);
    });
    expect(objectRef.current).toBe(null);
    expect(calls.at(-1)).toBe(null);
  });
});

describe("useCanvasDetection", () => {
  test("detects presence and relative position of canvas space", () => {
    document.body.innerHTML = "";
    const canvas = document.createElement("div");
    canvas.setAttribute("data-canvas-space", "true");
    Object.defineProperty(canvas, "getBoundingClientRect", {
      value: () =>
        ({
          left: 0,
          right: 100,
          top: 0,
          bottom: 50,
          width: 100,
          height: 50,
        }) as DOMRect,
    });
    const element = document.createElement("div");
    Object.defineProperty(element, "getBoundingClientRect", {
      value: () =>
        ({
          left: 200,
          right: 300,
          top: 0,
          bottom: 50,
          width: 100,
          height: 50,
        }) as DOMRect,
    });
    document.body.append(canvas, element);

    const ref = { current: element } as React.RefObject<HTMLElement | null>;
    const { result } = renderHook(() => useCanvasDetection(ref));

    // initial run
    expect(result.current.hasCanvasSpace).toBe(true);
    expect(result.current.canvasIsOnLeft).toBe(true);
  });
});
