"use server";

import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

import {
  QuoteProps,
  QuotePrompt,
  CertificationsPrompt,
} from "@/components/resuable/zod-types";

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
