import { act, renderHook } from "@testing-library/react";
import { usePanelState } from "./use-panel-state";

const STORAGE_KEY = "tambo-devtools-state";

beforeEach(() => {
  localStorage.clear();
});

describe("usePanelState", () => {
  it("returns default state when localStorage is empty", () => {
    const { result } = renderHook(() => usePanelState());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.activeTab).toBe("components");
    expect(result.current.panelHeight).toBe(350);
  });

  it("respects initialOpen on first mount when no prior state", () => {
    const { result } = renderHook(() => usePanelState({ initialOpen: true }));

    expect(result.current.isOpen).toBe(true);
  });

  it("ignores initialOpen when localStorage has prior state", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ isOpen: false, activeTab: "tools", panelHeight: 400 }),
    );

    const { result } = renderHook(() => usePanelState({ initialOpen: true }));

    expect(result.current.isOpen).toBe(false);
    expect(result.current.activeTab).toBe("tools");
  });

  it("toggle flips isOpen state", () => {
    const { result } = renderHook(() => usePanelState());

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it("close sets isOpen to false", () => {
    const { result } = renderHook(() => usePanelState({ initialOpen: true }));

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it("setActiveTab changes the active tab", () => {
    const { result } = renderHook(() => usePanelState());

    act(() => {
      result.current.setActiveTab("tools");
    });

    expect(result.current.activeTab).toBe("tools");
  });

  it("setPanelHeight updates height", () => {
    const { result } = renderHook(() => usePanelState());

    act(() => {
      result.current.setPanelHeight(500);
    });

    expect(result.current.panelHeight).toBe(500);
  });

  it("persists state to localStorage", () => {
    const { result } = renderHook(() => usePanelState());

    act(() => {
      result.current.toggle();
      result.current.setActiveTab("tools");
      result.current.setPanelHeight(420);
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.isOpen).toBe(true);
    expect(stored.activeTab).toBe("tools");
    expect(stored.panelHeight).toBe(420);
  });

  it("restores state from localStorage on mount", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ isOpen: true, activeTab: "tools", panelHeight: 500 }),
    );

    const { result } = renderHook(() => usePanelState());

    expect(result.current.isOpen).toBe(true);
    expect(result.current.activeTab).toBe("tools");
    expect(result.current.panelHeight).toBe(500);
  });

  it("setSelectedItem updates the selected item", () => {
    const { result } = renderHook(() => usePanelState());

    act(() => {
      result.current.setSelectedItem("WeatherCard");
    });

    expect(result.current.selectedItem).toBe("WeatherCard");

    act(() => {
      result.current.setSelectedItem(null);
    });

    expect(result.current.selectedItem).toBeNull();
  });

  it("setActiveTab clears selectedItem", () => {
    const { result } = renderHook(() => usePanelState());

    act(() => {
      result.current.setSelectedItem("WeatherCard");
    });

    expect(result.current.selectedItem).toBe("WeatherCard");

    act(() => {
      result.current.setActiveTab("tools");
    });

    expect(result.current.selectedItem).toBeNull();
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");

    const { result } = renderHook(() => usePanelState());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.activeTab).toBe("components");
  });

  it("handles localStorage.setItem failure gracefully", () => {
    const { result } = renderHook(() => usePanelState());

    // Make setItem throw (e.g. quota exceeded)
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("QuotaExceededError");
    };

    // Should not throw
    act(() => {
      result.current.toggle();
    });

    Storage.prototype.setItem = originalSetItem;
  });

  it("syncs across hooks via custom event", () => {
    const { result: hook1 } = renderHook(() => usePanelState());
    const { result: hook2 } = renderHook(() => usePanelState());

    act(() => {
      hook1.current.toggle();
    });

    // Both hooks should see the update
    expect(hook1.current.isOpen).toBe(true);
    expect(hook2.current.isOpen).toBe(true);
  });

  it("supports timeline as active tab", () => {
    const { result } = renderHook(() => usePanelState());

    act(() => {
      result.current.setActiveTab("timeline");
    });

    expect(result.current.activeTab).toBe("timeline");
  });

  it("persists timeline tab to localStorage", () => {
    const { result } = renderHook(() => usePanelState());

    act(() => {
      result.current.setActiveTab("timeline");
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.activeTab).toBe("timeline");
  });

  it("restores timeline tab from localStorage", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        isOpen: true,
        activeTab: "timeline",
        panelHeight: 350,
      }),
    );

    const { result } = renderHook(() => usePanelState());

    expect(result.current.activeTab).toBe("timeline");
  });
});
