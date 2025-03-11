"use client";

import { useEffect, useState } from "react";

type ScriptStatus = "idle" | "loading" | "ready" | "error";

/**
 * Hook to load third-party scripts efficiently
 * Improves FID (First Input Delay) by loading scripts at the right time
 *
 * @param src Script URL
 * @param delay Optional delay in ms before loading the script
 * @param strategy Loading strategy: 'afterInteractive' (default) or 'lazyOnload'
 */
export function useScript(
  src: string,
  delay = 0,
  strategy: "afterInteractive" | "lazyOnload" = "afterInteractive",
): ScriptStatus {
  const [status, setStatus] = useState<ScriptStatus>(src ? "loading" : "idle");

  useEffect(() => {
    if (!src) {
      setStatus("idle");
      return;
    }

    // If the script is already in the DOM, don't add it again
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      setStatus(
        existingScript.getAttribute("data-status") === "ready"
          ? "ready"
          : "loading",
      );
      return;
    }

    // Determine when to load the script based on strategy
    const shouldLoadNow = strategy === "afterInteractive";
    const shouldLoadLazy = strategy === "lazyOnload";

    // Event handler function
    const setAttributeFromEvent = (event: Event) => {
      const scriptStatus = event.type === "load" ? "ready" : "error";
      const target = event.currentTarget as HTMLScriptElement;
      target.setAttribute("data-status", scriptStatus);
      setStatus(scriptStatus);
    };

    const loadScript = () => {
      // Create script
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.setAttribute("data-status", "loading");

      // Add script to document body
      document.body.appendChild(script);

      // Add event handlers
      script.addEventListener("load", setAttributeFromEvent);
      script.addEventListener("error", setAttributeFromEvent);
    };

    if (shouldLoadNow) {
      // Load after a delay (if specified)
      if (delay > 0) {
        setTimeout(loadScript, delay);
      } else {
        loadScript();
      }
    } else if (shouldLoadLazy) {
      // Load when browser is idle
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => {
          setTimeout(loadScript, delay);
        });
      } else {
        // Fallback for browsers that don't support requestIdleCallback
        setTimeout(loadScript, delay + 1000);
      }
    }

    return () => {
      // Clean up event listeners if the component unmounts
      const script = document.querySelector(`script[src="${src}"]`);
      if (script) {
        script.removeEventListener("load", setAttributeFromEvent);
        script.removeEventListener("error", setAttributeFromEvent);
      }
    };
  }, [src, delay, strategy]);

  return status;
}
