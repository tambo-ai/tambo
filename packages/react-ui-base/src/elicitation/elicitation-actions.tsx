"use client";

import * as React from "react";
import { useElicitationContext } from "./elicitation-context";

export interface ElicitationActionsRenderProps {
  isSingleEntry: boolean;
  isValid: boolean;
  handleAccept: () => void;
  handleDecline: () => void;
  handleCancel: () => void;
}

export interface ElicitationActionsProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  children?:
    | React.ReactNode
    | ((props: ElicitationActionsRenderProps) => React.ReactNode);
}

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

    if (!keepMounted && hidden) {
      return null;
    }

    const renderProps = React.useMemo<ElicitationActionSubmitRenderProps>(
      () => ({
        hidden,
        disabled,
        handleAccept,
      }),
      [disabled, handleAccept, hidden],
    );

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
>(({ children, ...props }, ref) => {
  const { isSingleEntry, isValid, handleAccept, handleDecline, handleCancel } =
    useElicitationContext();

  const renderProps = React.useMemo<ElicitationActionsRenderProps>(
    () => ({
      isSingleEntry,
      isValid,
      handleAccept,
      handleDecline,
      handleCancel,
    }),
    [handleAccept, handleCancel, handleDecline, isSingleEntry, isValid],
  );

  let content: React.ReactNode;
  if (typeof children === "function") {
    content = children(renderProps);
  } else if (children !== undefined && children !== null) {
    content = children;
  } else {
    content = (
      <>
        <ElicitationActionCancel />
        <ElicitationActionDecline />
        <ElicitationActionSubmit />
      </>
    );
  }

  return (
    <div ref={ref} data-slot="elicitation-actions" {...props}>
      {content}
    </div>
  );
});
ElicitationActions.displayName = "Elicitation.Actions";
