import "@testing-library/jest-dom/vitest";

// Mock window.matchMedia for jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Node 22+ exposes an experimental globalThis.localStorage that shadows jsdom's
// implementation but throws "is not a function" without --localstorage-file.
// Install an in-memory Storage on globalThis and window so tests work uniformly.
class MemoryStorage implements Storage {
  #store = new Map<string, string>();
  get length() {
    return this.#store.size;
  }
  clear() {
    this.#store.clear();
  }
  getItem(key: string) {
    return this.#store.has(key) ? this.#store.get(key)! : null;
  }
  key(index: number) {
    return Array.from(this.#store.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.#store.delete(key);
  }
  setItem(key: string, value: string) {
    this.#store.set(key, String(value));
  }
}

const memoryStorage = new MemoryStorage();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  writable: true,
  value: memoryStorage,
});
Object.defineProperty(window, "localStorage", {
  configurable: true,
  writable: true,
  value: memoryStorage,
});
