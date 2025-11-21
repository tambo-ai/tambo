import { useCallback, useEffect, useRef, useState } from "react";
import { useCopyToClipboard } from "usehooks-ts";

/**
 * Hook that wraps useCopyToClipboard with automatic timeout functionality
 * to reset the copied state after a specified duration.
 *
 * @param text - The text to copy to clipboard
 * @param timeout - Duration in milliseconds before resetting copied state (default: 2000ms)
 * @returns Tuple of [copied, copy] where:
 *   - copied: boolean indicating if text was recently copied
 *   - copy: async function to copy the text to clipboard
 *
 * @example
 * ```tsx
 * const [copied, copy] = useClipboard("text to copy");
 * await copy(); // copies "text to copy"
 *
 * // With custom timeout
 * const [copied, copy] = useClipboard("text", 3000);
 * await copy(); // copied state resets after 3 seconds
 * ```
 */
export function useClipboard(text: string, timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const [, copyToClipboard] = useCopyToClipboard();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const copy = useCallback(async () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    if (text.length === 0) {
      return false;
    }

    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      timeoutRef.current = setTimeout(() => setCopied(false), timeout);
    }
    return success;
  }, [copyToClipboard, text, timeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [copied, copy] as const;
}
