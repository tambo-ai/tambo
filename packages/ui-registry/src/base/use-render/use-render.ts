import React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../types/component-render-or-children";

function useRender<RenderFunctionProps>(
  props: BasePropsWithChildrenOrRenderFunction<unknown, RenderFunctionProps>,
  renderFunctionProps: RenderFunctionProps,
): {
  content: React.ReactNode;
  componentProps: Omit<typeof props, "children" | "render">;
} {
  if ("render" in props && typeof props.render === "function") {
    const { render, ...rest } = props;
    return { content: render(renderFunctionProps), componentProps: rest };
  }

  if ("children" in props) {
    const { children, ...rest } = props;
    return { content: children, componentProps: rest };
  }

  return { content: null, componentProps: props };
}

export { useRender };
