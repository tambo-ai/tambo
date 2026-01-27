/**
 * Polyfills for browser compatibility
 */

// Polyfill for crypto.randomUUID in browsers that don't support it
if (typeof window !== "undefined" && typeof crypto !== "undefined") {
  if (!crypto.randomUUID) {
    crypto.randomUUID =
      function randomUUID(): `${string}-${string}-${string}-${string}-${string}` {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
          const num = parseInt(c, 10);
          return (
            num ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (num / 4)))
          ).toString(16);
        }) as `${string}-${string}-${string}-${string}-${string}`;
      };
  }
}
