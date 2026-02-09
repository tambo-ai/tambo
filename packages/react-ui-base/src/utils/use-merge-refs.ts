import * as React from "react";

/**
 * Merges multiple refs into a single callback ref.
 *
 * In React 19, callback refs may return cleanup functions; this hook fans out
 * both assignments and cleanups to all provided refs and tracks the last
 * cleanup so it runs when the instance changes.
 *
 * @param refs - The refs to merge
 * @returns A single callback ref that assigns to all provided refs, or null if all refs are null/undefined
 */
export function useMergeRefs<Instance>(
  ...refs: (React.Ref<Instance> | undefined)[]
): null | React.RefCallback<Instance> {
  const cleanupRef = React.useRef<void | (() => void)>(undefined);

  const refEffect = React.useCallback((instance: Instance | null) => {
    const cleanups = refs.map((ref) => {
      if (ref == null) {
        return;
      }

      if (typeof ref === "function") {
        const refCallback = ref;
        const refCleanup: void | (() => void) = refCallback(instance);
        return typeof refCleanup === "function"
          ? refCleanup
          : () => {
              refCallback(null);
            };
      }

      (ref as React.MutableRefObject<Instance | null>).current = instance;
      return () => {
        (ref as React.MutableRefObject<Instance | null>).current = null;
      };
    });

    return () => {
      cleanups.forEach((refCleanup) => refCleanup?.());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refs);

  return React.useMemo(() => {
    if (refs.every((ref) => ref == null)) {
      return null;
    }

    return (value) => {
      if (cleanupRef.current) {
        cleanupRef.current();
        (cleanupRef as React.MutableRefObject<void | (() => void)>).current =
          undefined;
      }

      if (value != null) {
        (cleanupRef as React.MutableRefObject<void | (() => void)>).current =
          refEffect(value);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refEffect, ...refs]);
}
