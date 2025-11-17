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

// Mock clipboard API
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(""),
    read: jest.fn().mockResolvedValue([]),
    write: jest.fn().mockResolvedValue(undefined),
  },
  writable: true,
  configurable: true,
});

// Disable framer-motion animations in tests
import { MotionGlobalConfig } from "framer-motion";
MotionGlobalConfig.skipAnimations = true;
