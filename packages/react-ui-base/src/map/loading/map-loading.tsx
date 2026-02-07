import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useMapRootContext } from "../root/map-root-context";

/**
 * Props passed to the MapLoading render function.
 */
export interface MapLoadingRenderProps {
  /** Whether the map is currently loading */
  isLoading: boolean;
}

export type MapLoadingProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
>;

/**
 * Loading primitive for the map component.
 * Only renders when the map is in a loading state.
 * The consumer provides the actual loading UI via children or render prop.
 * @returns The loading container element or null if not loading
 */
export const MapLoading = React.forwardRef<
  HTMLDivElement,
  BasePropsWithChildrenOrRenderFunction<MapLoadingProps, MapLoadingRenderProps>
>((props, ref) => {
  const { isLoading } = useMapRootContext();

  if (!isLoading) {
    return null;
  }

  const Comp = "asChild" in props && props.asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    isLoading,
  });

  return (
    <Comp ref={ref} data-slot="map-loading" {...componentProps}>
      {content}
    </Comp>
  );
});
MapLoading.displayName = "MapBase.Loading";
