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

  if (typeof children === "function") {
    return (
      <div ref={ref} data-slot="elicitation-actions" {...props}>
        {children(renderProps)}
      </div>
    );
  }

  return (
    <div ref={ref} data-slot="elicitation-actions" {...props}>
      <button
        type="button"
        onClick={handleCancel}
        data-slot="elicitation-action-cancel"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleDecline}
        data-slot="elicitation-action-decline"
      >
        Decline
      </button>
      {!isSingleEntry ? (
        <button
          type="button"
          onClick={handleAccept}
          disabled={!isValid}
          data-slot="elicitation-action-submit"
          data-disabled={!isValid || undefined}
        >
          Submit
        </button>
      ) : null}
      {children}
    </div>
  );
});
ElicitationActions.displayName = "Elicitation.Actions";
