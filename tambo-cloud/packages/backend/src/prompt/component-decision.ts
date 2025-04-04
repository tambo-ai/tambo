import { createPromptTemplate } from "@tambo-ai-cloud/core";
import { JSONSchema7 } from "json-schema";
import OpenAI from "openai";
import { AvailableComponents } from "../model/component-metadata";
import { generateAvailableComponentsPrompt } from "./component-formatting";

export function generateDecisionPrompt(availableComponents: string) {
  return createPromptTemplate(
    `
You are a simple AI assistant. Your goal is to decide whether or not a UI component should be generated, 
and if so, what component.

To accomplish your task, you will be given a list of available components and the existing message history.
First you will reason about whether you think a component should be generated, spoken to the user, such as 
"It looks like you are asking about weather, let me show you some weather information.". 
Reasoning should be a single sentence.

Then you will output a boolean flag (true or false) indicating whether or not a component should be generated.

Finally, if you decide that a component should be generated, you will output the name of the component tags.

Emit your decision by calling the "decide_component" tool.

These are the available components:
<availableComponents>
    {availableComponents}
</availableComponents>
`,
    {
      availableComponents:
        availableComponents.length > 0
          ? availableComponents
          : "No components available, do not try and generate a component.",
    },
  );
}

const noComponentPrompt = `You are an AI assistant that interacts with users and helps them perform tasks. You have determined that you cannot generate any components to help the user with their latest query for the following reason:
<reasoning>{reasoning}</reasoning>.
<availableComponents>
{availableComponents}
</availableComponents>
Respond to the user's latest query to the best of your ability. If they have requested a task that you cannot help with, tell them so and recommend something you can help with.
Each message in the conversation history might contain a component decision, which is a component that has been shown to the user, and a component state, which is the state of the component which the user may have updated. Use this information to help you determine what to do.
This response should be short and concise.`;

export function getNoComponentPromptTemplate(
  reasoning: string,
  availableComponents: AvailableComponents,
) {
  const availableComponentsStr =
    generateAvailableComponentsPrompt(availableComponents);
  return createPromptTemplate(noComponentPrompt, {
    reasoning,
    availableComponents: availableComponentsStr,
  });
}

export const decideComponentTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "decide_component",
    strict: true,
    parameters: {
      type: "object",
      required: ["reasoning", "decision", "component"],
      additionalProperties: false,
      properties: {
        reasoning: {
          type: "string",
          description:
            "A sentence of reasoning about whether a component should be generated, spoken to the user.",
        },
        decision: {
          type: "boolean",
          description: "Whether a component should be generated",
        },
        component: {
          type: ["string", "null"],
          description:
            "The name of the component to generate, if a component should be generated",
        },
      },
    } satisfies JSONSchema7,
    description:
      "Decide which component to use, if any, based on the conversation history and available components",
  },
};
