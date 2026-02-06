import * as React from "react";

type ComponentRenderFn<Props> = (props: Props) => React.ReactNode;

type PropsWithRenderFunction<
  ComponentProps = unknown,
  RenderPropProps = never,
> = ComponentProps & {
  render?: ComponentRenderFn<RenderPropProps>;
};

export type BaseProps<ComponentProps> = ComponentProps & {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
};

export type PropsWithChildrenOrRenderFunction<
  ComponentProps,
  RenderPropProps = never,
> =
  | React.PropsWithChildren<ComponentProps>
  | PropsWithRenderFunction<ComponentProps, RenderPropProps>;

export type BasePropsWithChildrenOrRenderFunction<
  ComponentProps,
  RenderPropProps = never,
> = PropsWithChildrenOrRenderFunction<
  BaseProps<ComponentProps>,
  RenderPropProps
>;
