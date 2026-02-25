"use client";

import { ComponentRenderFn, useRender } from "@base-ui/react";
import * as React from "react";
import { useElicitationContext } from "./elicitation-context";

export interface ElicitationActionsState {
  single: boolean;
  valid: boolean;
}

interface ElicitationRenderProps {
  handleAccept: () => void;
  handleDecline: () => void;
  handleCancel: () => void;
}

export type ElicitationActionsProps = useRender.ComponentProps<
  "div",
  ElicitationActionsState,
  useRender.ElementProps<"div"> & ElicitationRenderProps
>;

export interface ElicitationActionCancelRenderProps {
  handleCancel: () => void;
}

export interface ElicitationActionCancelProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  children?:
    | React.ReactNode
    | ((props: ElicitationActionCancelRenderProps) => React.ReactNode);
}

export const ElicitationActionCancel = React.forwardRef<
  HTMLButtonElement,
  ElicitationActionCancelProps
>(({ children, onClick, ...props }, ref) => {
  const { handleCancel } = useElicitationContext();

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      handleCancel();
    },
    [handleCancel, onClick],
  );

  const renderProps = React.useMemo<ElicitationActionCancelRenderProps>(
    () => ({
      handleCancel,
    }),
    [handleCancel],
  );

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      data-slot="elicitation-action-cancel"
      {...props}
    >
      {typeof children === "function"
        ? children(renderProps)
        : (children ?? "Cancel")}
    </button>
  );
});
ElicitationActionCancel.displayName = "Elicitation.ActionCancel";

export interface ElicitationActionDeclineRenderProps {
  handleDecline: () => void;
}

export interface ElicitationActionDeclineProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  children?:
    | React.ReactNode
    | ((props: ElicitationActionDeclineRenderProps) => React.ReactNode);
}

export const ElicitationActionDecline = React.forwardRef<
  HTMLButtonElement,
  ElicitationActionDeclineProps
>(({ children, onClick, ...props }, ref) => {
  const { handleDecline } = useElicitationContext();

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      handleDecline();
    },
    [handleDecline, onClick],
  );

  const renderProps = React.useMemo<ElicitationActionDeclineRenderProps>(
    () => ({
      handleDecline,
    }),
    [handleDecline],
  );

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      data-slot="elicitation-action-decline"
      {...props}
    >
      {typeof children === "function"
        ? children(renderProps)
        : (children ?? "Decline")}
    </button>
  );
});
ElicitationActionDecline.displayName = "Elicitation.ActionDecline";

export interface ElicitationActionSubmitRenderProps {
  hidden: boolean;
  disabled: boolean;
  handleAccept: () => void;
}

export interface ElicitationActionSubmitProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  keepMounted?: boolean;
  children?:
    | React.ReactNode
    | ((props: ElicitationActionSubmitRenderProps) => React.ReactNode);
}

export const ElicitationActionSubmit = React.forwardRef<
  HTMLButtonElement,
  ElicitationActionSubmitProps
>(
  (
    {
      children,
      keepMounted = false,
      onClick,
      tabIndex: propTabIndex,
      ...props
    },
    ref,
  ) => {
    const { isSingleEntry, isValid, handleAccept } = useElicitationContext();
    const hidden = isSingleEntry;
    const disabled = !isValid;
    const effectiveTabIndex = hidden ? -1 : propTabIndex;

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented || hidden || disabled) return;
        handleAccept();
      },
      [disabled, handleAccept, hidden, onClick],
    );
    const enabled = !hidden || keepMounted;

    const renderProps = React.useMemo<ElicitationActionSubmitRenderProps>(
      () => ({
        hidden,
        disabled,
        handleAccept,
      }),
      [disabled, handleAccept, hidden],
    );

    if (!enabled) return null;

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        disabled={disabled}
        tabIndex={effectiveTabIndex}
        aria-hidden={hidden || undefined}
        data-slot="elicitation-action-submit"
        data-disabled={disabled || undefined}
        data-hidden={hidden || undefined}
        hidden={hidden && keepMounted}
        {...props}
      >
        {typeof children === "function"
          ? children(renderProps)
          : (children ?? "Submit")}
      </button>
    );
  },
);
ElicitationActionSubmit.displayName = "Elicitation.ActionSubmit";

export const ElicitationActions = React.forwardRef<
  HTMLDivElement,
  ElicitationActionsProps
>(({ render, children, ...props }, ref) => {
  const { isSingleEntry, isValid, handleAccept, handleDecline, handleCancel } =
    useElicitationContext();

  const content = children ?? (
    <>
      <ElicitationActionCancel />
      <ElicitationActionDecline />
      <ElicitationActionSubmit />
    </>
  );

  return useRender({
    defaultTagName: "div",
    ref,
    render: ((props, state) => {
      if (React.isValidElement(render)) {
        return React.cloneElement(render, props);
      }
      if (typeof render === "function") {
        return render(
          { ...props, handleAccept, handleDecline, handleCancel },
          state,
        );
      }
      return children ?? content;
    }) as ComponentRenderFn<ElicitationActionsProps, ElicitationActionsState>,
    props,
    state: {
      single: isSingleEntry,
      valid: isValid,
    },
  });
});
ElicitationActions.displayName = "Elicitation.Actions";
