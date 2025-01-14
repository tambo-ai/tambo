import { z } from "zod";

export const schema = z.object({
  componentName: z.string().describe("The name of the chosen component"),
  props: z
    .object({})
    .passthrough()
    .describe(
      "The props that should be used in the chosen component. These will be injected by using React.createElement(component, props)",
    ),
  message: z
    .string()
    .describe(
      "The message to be displayed to the user alongside the chosen component. Depending on the component type, and the user message, this message might include a description of why a given component was chosen, and what can be seen within it, or what it does.",
    ),
  reasoning: z.string().describe("The reasoning behind the decision"),
  suggestedActions: z
    .array(
      z.object({
        label: z
          .string()
          .describe(
            "The text to show for this action in a button. This should be a short, concise label that would be used in a button, and should describe what the action does.",
          ),
        actionText: z
          .string()
          .describe(
            "The exact text that will be sent to the AI on the user's behalf when they select this action.",
          ),
      }),
    )
    .max(3)
    .describe(
      "Up to 3 suggested next actions that would make sense given the current context. Only include if relevant.",
    )
    .optional(),
});
