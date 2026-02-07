import * as React from "react";

type ComponentRenderFn<Props> = (props: Props) => React.ReactNode;

export type BaseProps<ComponentProps> = ComponentProps & {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
};

/**
 * Allows children to be either static ReactNode or a render function
 * that receives props from the parent component's context.
 *
 * Preferred: use children as a function for render props.
 * Deprecated: the `render` prop is supported for backwards compatibility
 * but should not be used in new code.
 */
export type PropsWithChildrenOrRenderFunction<
  ComponentProps,
  RenderPropProps = never,
> = Omit<ComponentProps, "children"> & {
  children?: React.ReactNode | ((props: RenderPropProps) => React.ReactNode);
  /** @deprecated Use children as a function instead. */
  render?: ComponentRenderFn<RenderPropProps>;
};

export type BasePropsWithChildrenOrRenderFunction<
  ComponentProps,
  RenderPropProps = never,
> = PropsWithChildrenOrRenderFunction<
  BaseProps<ComponentProps>,
  RenderPropProps
>;
