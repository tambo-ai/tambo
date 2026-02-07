import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useMapRootContext } from "../root/map-root-context";

/**
 * Props passed to the MapError render function.
 */
export interface MapErrorRenderProps {
  /** Whether the map has an error (missing center coordinates) */
  hasError: boolean;
}

export type MapErrorProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
>;

/**
 * Error primitive for the map component.
 * Only renders when the map is in an error state (e.g., missing center coordinates).
 * Does not render during loading state even if error is present.
 * The consumer provides the actual error UI via children or render prop.
 * @returns The error container element or null if no error
 */
export const MapError = React.forwardRef<
  HTMLDivElement,
  BasePropsWithChildrenOrRenderFunction<MapErrorProps, MapErrorRenderProps>
>((props, ref) => {
  const { hasError, isLoading } = useMapRootContext();

  if (!hasError || isLoading) {
    return null;
  }

  const Comp = "asChild" in props && props.asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    hasError,
  });

  return (
    <Comp ref={ref} data-slot="map-error" {...componentProps}>
      {content}
    </Comp>
  );
});
MapError.displayName = "MapBase.Error";
