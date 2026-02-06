import React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../types/component-render-or-children";

function useRender<RenderFunctionProps>(
  props: BasePropsWithChildrenOrRenderFunction<unknown, RenderFunctionProps>,
  renderFunctionProps: RenderFunctionProps,
): {
  content: React.ReactNode;
  componentProps: Omit<typeof props, "children" | "render">;
} {
  // Prefer children-as-function over deprecated render prop
  if ("children" in props && props.children != null) {
    const { children, render: _render, ...rest } = props;
    if (typeof children === "function") {
      return { content: children(renderFunctionProps), componentProps: rest };
    }
    return { content: children, componentProps: rest };
  }

  // Deprecated: fall back to render prop for backwards compatibility
  if ("render" in props && typeof props.render === "function") {
    const { render, children: _children, ...rest } = props;
    return { content: render(renderFunctionProps), componentProps: rest };
  }

  const { render: _render, children: _children, ...rest } = props;
  return { content: null, componentProps: rest };
}

export { useRender };
