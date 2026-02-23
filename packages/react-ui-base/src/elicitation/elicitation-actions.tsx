"use client";

import { ComponentRenderFn, mergeProps, useRender } from "@base-ui/react";
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

export const ElicitationActions = React.forwardRef<
  HTMLDivElement,
  ElicitationActionsProps
>(({ render, children, ...props }, ref) => {
  const { isSingleEntry, isValid, handleAccept, handleDecline, handleCancel } =
    useElicitationContext();

  const buttons = React.useMemo(
    () => (
      <>
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
      </>
    ),
    [handleAccept, handleDecline, handleCancel, isSingleEntry, isValid],
  );

  return useRender({
    defaultTagName: "div",
    ref,
    render: render as ComponentRenderFn<
      ElicitationActionsProps,
      ElicitationActionsState
    >,
    props: mergeProps(props, {
      handleAccept,
      handleDecline,
      handleCancel,
      children: children ?? buttons,
    }),
    state: {
      single: isSingleEntry,
      valid: isValid,
    },
  });
});
ElicitationActions.displayName = "Elicitation.Actions";
