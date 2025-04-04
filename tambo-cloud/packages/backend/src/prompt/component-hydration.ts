import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  AvailableComponents,
  ToolResponseBody,
} from "../model/component-metadata";
import { generateAvailableComponentsPrompt } from "./component-formatting";
import { schemaV1, schemaV2 } from "./schemas";

const basePrompt = `You are an AI assistant that interacts with users and helps them perform tasks.
To help the user perform these tasks, you are able to generate UI components. You are able to display components and decide what props to pass in. 

When prompted, you will be given the existing conversation history, followed by the component to display, 
its description provided by the user, the shape of any props to pass in, and any other related context.

Use the conversation history and other provided context to determine what props to pass in.
Certain messages in the conversation history may contain a component decision, which is a component that has been shown to the user.
That component has a few important properties:
- componentName: The name of the component
- props: The props that were passed in to the component
- componentState: The internal state of the component (sort of like uses ofuseState in react)
- suggestedActions: Any suggested actions that the user can take

When possible, carry the componentState forward from the last component decision into the next component decision.

This response should be short and concise.
`;

const suggestedActionsGuidelines = `When generating suggestedActions, consider the following:
1. Each suggestion should be a natural follow-up action that would make use of an available components
2. The actionText should be phrased as a user message that would trigger the use of a specific component
3. Suggestions should be contextually relevant to what the user is trying to accomplish
4. Include 1-3 suggestions that would help the user progress in their current task
5. The label should be a clear, concise button text, while the actionText can be more detailed`;

// Version-specific base prompts
const basePromptV1 = `${basePrompt}\n${suggestedActionsGuidelines}`;
const basePromptV2 = basePrompt;

const componentHydrationPromptWithToolResponse = (version: "v1" | "v2") =>
  `${version === "v1" ? basePromptV1 : basePromptV2}
You have received a response from a tool. Use this data to help determine what props to pass in: {toolResponseString}

{availableComponentsPrompt}

{zodTypePrompt}` as const;

const componentHydrationPromptWithoutToolResponse = (version: "v1" | "v2") =>
  `${version === "v1" ? basePromptV1 : basePromptV2}
You can also use any of the provided tools to fetch data needed to pass into the component.

{availableComponentsPrompt}

{zodTypePrompt}` as const;

function getComponentHydrationPromptWithToolResponseTemplate(
  toolResponseString: string,
  availableComponentsPrompt: string,
  zodTypePrompt: string,
  version: "v1" | "v2" = "v1",
) {
  return {
    template: componentHydrationPromptWithToolResponse(version),
    args: { toolResponseString, availableComponentsPrompt, zodTypePrompt },
  };
}

function getComponentHydrationPromptWithoutToolResponseTemplate(
  availableComponentsPrompt: string,
  zodTypePrompt: string,
  version: "v1" | "v2" = "v1",
) {
  return {
    template: componentHydrationPromptWithoutToolResponse(version),
    args: { availableComponentsPrompt, zodTypePrompt },
  };
}

function generateZodTypePrompt(schema: z.ZodSchema): string {
  return `
      Return a JSON object that matches the given Zod schema.
      If a field is Optional and there is no input don't include in the JSON response.
      Only use tailwind classes where it explicitly says to use them.
      ${generateFormatInstructions(schema)}
    `;
}

function generateFormatInstructions(schema: z.ZodSchema): string {
  return `You must format your output as a JSON value that adheres to a given "JSON Schema" instance.

    "JSON Schema" is a declarative language that allows you to annotate and validate JSON documents.
    For example, the example "JSON Schema" instance {{"properties": {{"foo": {{"description": "a list of test words", "type": "array", "items": {{"type": "string"}}}}}}, "required": ["foo"]}}}}
    would match an object with one required property, "foo". The "type" property specifies "foo" must be an "array", and the "description" property semantically describes it as "a list of test words". The items within "foo" must be strings.
    Thus, the object {{"foo": ["bar", "baz"]}} is a well-formatted instance of this example "JSON Schema". The object {{"properties": {{"foo": ["bar", "baz"]}}}} is not well-formatted.

    Your output will be parsed and type-checked according to the provided schema instance, so make sure all fields in your output match the schema exactly and there are no trailing commas!

    Here is the JSON Schema instance your output must adhere to. Only return valid JSON Schema.
    \`\`\`json
    ${JSON.stringify(zodToJsonSchema(schema), null, 2)}
    \`\`\`
    `;
}

export function getComponentHydrationPromptTemplate(
  toolResponse: ToolResponseBody | undefined,
  availableComponents: AvailableComponents,
  version: "v1" | "v2" = "v1",
) {
  const toolResponseString = toolResponse
    ? JSON.stringify(toolResponse)
    : undefined;
  const availableComponentsPrompt =
    generateAvailableComponentsPrompt(availableComponents);
  const zodTypePrompt = generateZodTypePrompt(
    version === "v1" ? schemaV1 : schemaV2,
  );

  if (toolResponseString) {
    return getComponentHydrationPromptWithToolResponseTemplate(
      toolResponseString,
      availableComponentsPrompt,
      zodTypePrompt,
      version,
    );
  }

  return getComponentHydrationPromptWithoutToolResponseTemplate(
    availableComponentsPrompt,
    zodTypePrompt,
    version,
  );
}
