/*
  This file contains the zod types & prompts for the reusable components
  NextJS doesn't allow importing from a client side file on the server.
*/

import { z } from "zod";

// Quote Form
export const QuoteFormPrompt =
  "Based on the provided information, fill in the below for a Quote Form component:";

export const QuoteFormProps = z
  .object({
    services: z
      .array(z.string())
      .optional()
      .default([])
      .describe("List of services"),
    successMessage: z
      .string()
      .default("Your form has been submitted successfully.")
      .describe("Message displayed on successful submission"),
    errorMessage: z
      .string()
      .default("There was an error submitting your form. Please try again.")
      .describe("Message displayed on failed submission"),
    successTitle: z
      .string()
      .default("Success")
      .describe("Title displayed on successful submission"),
    errorTitle: z
      .string()
      .default("Error")
      .describe("Title displayed on failed submission"),
  })
  .describe(
    "Ensure all the tailwind classes are valid and the component is styled to match the rest of the style"
  );

// Quote
export const QuotePrompt = `
  Clear and direct language
  Compelling and persuasive
  Action-oriented verbs
  Creates a sense of urgency
  Highlights the benefit of taking action
  Easy to locate on the page
  Visually stands out
  Aligned with the overall tone and message
  Includes minimal and relevant information fields
  Provides reassurance or security if needed
  Based on the provided information, fill in the below for a Quote Card component:
`;
export const QuoteProps = z
  .object({
    cardTitle: z
      .string()
      .describe(
        "The title of the card, should be a question that is being asked to the visitor."
      ),
    cardDescription: z
      .string()
      .describe(
        "The description of the card, should be a short and concise message that explains what the visitor is asking for and what they will get."
      ),
    successMessage: z.string().describe("Message displayed on success"),
    errorMessage: z.string().describe("Message displayed on error"),
    successTitle: z.string().describe("Title displayed on success"),
    errorTitle: z.string().describe("Title displayed on error"),
    errorTitleClassName : z.string().describe("this a tailwinds class"),
    services: z.array(z.string()).describe("A list of all the services above"),
  })
  .describe(
    "Ensure all the tailwind classes are valid and the component is styled to match the rest of the style"
  );
