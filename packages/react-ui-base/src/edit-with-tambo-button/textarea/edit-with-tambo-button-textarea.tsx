import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { useEditWithTamboButtonContext } from "../root/edit-with-tambo-button-context";

export type EditWithTamboButtonTextareaProps = BaseProps<
  Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "value" | "onChange" | "onKeyDown" | "disabled"
  >
>;

/**
 * Textarea for entering the edit prompt.
 * Automatically binds to the prompt state, keyboard handler, and disabled state
 * from context. Uses the textarea ref from context for auto-focus support.
 * @returns A textarea element bound to the prompt state.
 */
export const EditWithTamboButtonTextarea = React.forwardRef<
  HTMLTextAreaElement,
  EditWithTamboButtonTextareaProps
>(({ asChild, ...props }, ref) => {
  const { prompt, setPrompt, handleKeyDown, isGenerating, textareaRef } =
    useEditWithTamboButtonContext();

  // Combine the forwarded ref with the context ref
  const combinedRef = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      (
        textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>
      ).current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref, textareaRef],
  );

  const Comp = asChild ? Slot : "textarea";

  return (
    <Comp
      ref={combinedRef}
      value={prompt}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
        setPrompt(e.target.value)
      }
      onKeyDown={handleKeyDown}
      disabled={isGenerating}
      data-slot="edit-with-tambo-button-textarea"
      data-generating={isGenerating || undefined}
      {...props}
    />
  );
});
EditWithTamboButtonTextarea.displayName = "EditWithTamboButton.Textarea";
