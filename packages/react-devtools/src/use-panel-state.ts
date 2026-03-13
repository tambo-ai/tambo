import { useEffect, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "tambo-devtools-state";

export type Tab = "components" | "tools" | "timeline";

interface PanelState {
  isOpen: boolean;
  activeTab: Tab;
  panelHeight: number;
  selectedItem: string | null;
}

const DEFAULT_STATE: PanelState = {
  isOpen: false,
  activeTab: "components",
  panelHeight: 350,
  selectedItem: null,
};

const listeners = new Set<() => void>();

// Cached snapshot for referential stability (useSyncExternalStore requirement)
let cachedRaw: string | null = null;
let cachedState: PanelState = DEFAULT_STATE;

const emitChange = () => {
  // Invalidate cache so getSnapshot reads fresh
  cachedRaw = null;
  for (const listener of listeners) {
    listener();
  }
};

const readStorage = (): PanelState => {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);

  // Return cached state if raw value hasn't changed
  if (raw === cachedRaw) {
    return cachedState;
  }

  cachedRaw = raw;
  if (!raw) {
    cachedState = DEFAULT_STATE;
    return DEFAULT_STATE;
  }
  try {
    cachedState = { ...DEFAULT_STATE, ...JSON.parse(raw) };
    return cachedState;
  } catch {
    cachedState = DEFAULT_STATE;
    return DEFAULT_STATE;
  }
};

const writeStorage = (state: PanelState) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Dispatch a custom event for same-tab sync (storage event only fires cross-tab)
    window.dispatchEvent(new CustomEvent("tambo-devtools-sync"));
  } catch {
    // localStorage may be unavailable
  }
};

const subscribe = (callback: () => void) => {
  listeners.add(callback);

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      emitChange();
    }
  };

  const handleCustomSync = () => {
    emitChange();
  };

  window.addEventListener("storage", handleStorageEvent);
  window.addEventListener("tambo-devtools-sync", handleCustomSync);

  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", handleStorageEvent);
    window.removeEventListener("tambo-devtools-sync", handleCustomSync);
  };
};

const getSnapshot = () => readStorage();
const getServerSnapshot = () => DEFAULT_STATE;

export interface UsePanelStateOptions {
  initialOpen?: boolean;
}

export interface UsePanelStateReturn {
  isOpen: boolean;
  activeTab: Tab;
  panelHeight: number;
  selectedItem: string | null;
  toggle: () => void;
  close: () => void;
  setActiveTab: (tab: Tab) => void;
  setPanelHeight: (height: number) => void;
  setSelectedItem: (name: string | null) => void;
}

/**
 * Manages devtools panel state with localStorage persistence via useSyncExternalStore.
 * Handles open/close, active tab, panel height, and selected item tracking.
 * @param options - Configuration options
 * @returns Panel state and actions
 */
export const usePanelState = (
  options: UsePanelStateOptions = {},
): UsePanelStateReturn => {
  const { initialOpen } = options;

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Apply initialOpen on first mount (only if localStorage has no prior state)
  useEffect(() => {
    if (initialOpen === undefined) {
      return;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      writeStorage({ ...DEFAULT_STATE, isOpen: initialOpen });
      emitChange();
    }
  }, [initialOpen]);

  const actions = useMemo(
    () => ({
      toggle: () => {
        const current = readStorage();
        writeStorage({ ...current, isOpen: !current.isOpen });
        emitChange();
      },
      close: () => {
        const current = readStorage();
        writeStorage({ ...current, isOpen: false });
        emitChange();
      },
      setActiveTab: (tab: Tab) => {
        const current = readStorage();
        writeStorage({ ...current, activeTab: tab, selectedItem: null });
        emitChange();
      },
      setPanelHeight: (height: number) => {
        const current = readStorage();
        writeStorage({ ...current, panelHeight: height });
        emitChange();
      },
      setSelectedItem: (name: string | null) => {
        const current = readStorage();
        writeStorage({ ...current, selectedItem: name });
        emitChange();
      },
    }),
    [],
  );

  return {
    ...state,
    ...actions,
  };
};
