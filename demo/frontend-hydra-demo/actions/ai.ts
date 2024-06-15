"use server";

import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

import { TimeSeriesDataProps } from "../components/types";

const ScratchPadSchema = z.object({
  explanation: z.string(),
  data: z.any(),
});

type ComponentType = {
  props: z.ZodSchema<any>;
};

const component_types: { [key: string]: ComponentType } = {
  graph: { props: TimeSeriesDataProps },
};

export async function generateResponse(
  component_type: string,
  user_instruction: string
) {
  const component = component_types[component_type];
  if (!component) {
    throw new Error(`Invalid component type: ${component_type}`);
  }
  let componentProps, parser;
  try {
    ({ props: componentProps } = component);
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
        `{user_instruction}
        You are a frontend developer, designer and copywriter extraordinaire.
        Generate a JSON object that matches the given Zod schema based on the user instrucitons above:
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
      format_instructions: parser.getFormatInstructions(),
      user_instruction: user_instruction,
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
