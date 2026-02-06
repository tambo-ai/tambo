import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useEditWithTamboButtonContext } from "../root/edit-with-tambo-button-context";
import type { EditWithTamboButtonSendMode } from "../root/edit-with-tambo-button-context";

/**
 * Props passed to the SendButton render function.
 */
export interface EditWithTamboButtonSendButtonRenderProps {
  /** Whether the AI is currently generating. */
  isGenerating: boolean;
  /** The current send mode. */
  sendMode: EditWithTamboButtonSendMode;
  /** Whether the button is disabled (no prompt or generating). */
  isDisabled: boolean;
  /** The label to display on the button. */
  label: string;
}

export type EditWithTamboButtonSendButtonProps =
  BasePropsWithChildrenOrRenderFunction<
    Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      "onClick" | "disabled" | "children"
    >,
    EditWithTamboButtonSendButtonRenderProps
  >;

/**
 * Main action button that sends the prompt.
 * Delegates to either inline send or send-in-thread based on the current mode.
 * Supports render props for custom label rendering.
 * @returns A button element that triggers the main send action.
 */
export const EditWithTamboButtonSendButton = React.forwardRef<
  HTMLButtonElement,
  EditWithTamboButtonSendButtonProps
>(({ asChild, ...props }, ref) => {
  const { handleMainAction, prompt, isGenerating, sendMode } =
    useEditWithTamboButtonContext();

  const isDisabled = !prompt.trim() || isGenerating;

  let label = "Send";
  if (isGenerating) {
    label = "Sending...";
  } else if (sendMode === "thread") {
    label = "Send in Thread";
  }

  const Comp = asChild ? Slot : "button";

  const { content, componentProps } = useRender(props, {
    isGenerating,
    sendMode,
    isDisabled,
    label,
  });

  return (
    <Comp
      ref={ref}
      type="button"
      onClick={handleMainAction}
      disabled={isDisabled}
      data-slot="edit-with-tambo-button-send-button"
      data-send-mode={sendMode}
      data-generating={isGenerating || undefined}
      {...componentProps}
    >
      {content ?? label}
    </Comp>
  );
});
EditWithTamboButtonSendButton.displayName = "EditWithTamboButton.SendButton";
