import "@testing-library/jest-dom";

// Polyfill ResizeObserver for components using cmdk/radix that rely on it
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!global.ResizeObserver) {
  global.ResizeObserver = ResizeObserver;
}

// Polyfill scrollIntoView used by cmdk for option visibility
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
