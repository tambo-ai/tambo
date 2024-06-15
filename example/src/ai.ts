"use server";

import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

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

const ScratchPadSchema = z.object({
  explanation: z.string(),
  data: z.any(),
});

type ComponentType = {
  props: z.ZodSchema<any>;
  prompt: string;
};

const component_types: { [key: string]: ComponentType } = {
  quote: { props: QuoteProps, prompt: QuotePrompt },
};

export async function generateResponse(
  site_data: string,
  component_type: string
  variable_ 
) {
  const component = component_types[component_type];
  if (!component) {
    throw new Error(`Invalid component type: ${component_type}`);
  }
  let componentPrompt, componentProps, parser;
  try {
    ({ prompt: componentPrompt, props: componentProps } = component);
    parser = StructuredOutputParser.fromZodSchema(
      ScratchPadSchema.extend({
        data: componentProps,
      })
    );
  } catch (error) {
    console.error(
      "Error extracting component properties or creating parser:",
      error
    );
    throw error;
  }
  try {
    const chain = RunnableSequence.from([
      PromptTemplate.fromTemplate(
        `{site_data}
        Above is a summary of their previous site data.
        You are a frontend developer, designer and copywriter extraordinaire.
        You are designing a new site and you are given the site data and a component prompt.
        Special Instructions for this Component: {component_prompt}
        Generate a JSON object that matches the given Zod schema.
        If a field is Optional and there is no input don't include in the JSON response. 
        {format_instructions}
        Always think step-by-step and show all your work in the explanation.
        {user_instruction} <-- make error read
        `
      ),
      new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0.7,
        apiKey: process.env.OPENAI_API_KEY,
      }).bind({
        response_format: {
          type: "json_object",
        },
      }),
      parser,
    ]);
    console.log(`Format Instructions: ${parser.getFormatInstructions()}`);

    const response = await chain.invoke({
      site_data,
      component_prompt: componentPrompt,
      format_instructions: parser.getFormatInstructions(),
      user_instruction: Variable
    });
    console.log(parser.getFormatInstructions());
    console.log(response);

    return response.data;
  } catch (error) {
    console.error("Error generating response:", error);
    console.log(parser.getFormatInstructions());
    throw error;
  }
}
