import { z } from "zod/v3";

const baseSchema = {
  message: z
    .string()
    .describe(
      "The message to be displayed to the user alongside the chosen component. Depending on the component type, and the user message, this message might include a description of why a given component was chosen, and what can be seen within it, or what it does.",
    ),
  componentName: z.string().describe("The name of the chosen component"),
  reasoning: z.string().describe("The reasoning behind the decision"),
  componentState: z
    .record(z.any())
    .optional()
    .describe(
      `Any additional state properties that should be injected into the component, 
used to carry state forward from previous component decisions.`,
    ),
  props: z
    .record(z.any())
    .describe(
      "The props that should be used in the chosen component. These will be injected by using React.createElement(component, props)",
    ),
};

const suggestedActionsSchema = z
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
  .optional();

// Legacy v1 schema that includes suggested actions
export const schemaV1 = z.object({
  ...baseSchema,
  suggestedActions: suggestedActionsSchema,
});

// Modern v2 schema without suggested actions
export const schemaV2 = z.object(baseSchema);
