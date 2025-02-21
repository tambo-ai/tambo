import { ThreadMessage } from "@use-hydra-ai/core";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  AvailableComponent,
  AvailableComponents,
  ToolResponseBody,
} from "../../model/component-metadata";
import { schemaV1, schemaV2 } from "./schemas";
export interface PromptTemplate {
  template: string;
  args: Record<string, string>;
  version?: "v1" | "v2";
}

export function getBasePrompt(version: "v1" | "v2" = "v1"): string {
  return version === "v1" ? basePromptV1 : basePromptV2;
}

// Public functions
export function generateDecisionPrompt(): string {
  return `You are a simple AI assistant. Your goal is to output a boolean flag (true or false) indicating whether or not a UI component should be generated.
To accomplish your task, you will be given a list of available components and the existing message history.
First you will reason about whether you think a component should be generated. Reasoning should be a single sentence and output between <reasoning></reasoning> tags.
Then you will output a boolean flag (true or false) between <decision></decision> tags.
Finally, if you decide that a component should be generated, you will output the name of the component between <component></component> tags.`;
}

export const noComponentPrompt = `You are an AI assistant that interacts with users and helps them perform tasks. You have determined that you cannot generate any components to help the user with their latest query for the following reason:
<reasoning>{reasoning}</reasoning>.
<availableComponents>
{availableComponents}
</availableComponents>
Respond to the user's latest query to the best of your ability. If they have requested a task that you cannot help with, tell them so and recommend something you can help with.
This response should be short and concise.`;

export function getNoComponentPromptTemplate(
  reasoning: string,
  availableComponents: AvailableComponents,
): PromptTemplate {
  const availableComponentsStr =
    generateAvailableComponentsPrompt(availableComponents);
  return {
    template: noComponentPrompt,
    args: { reasoning, availableComponents: availableComponentsStr },
  };
}

function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>,
): string {
  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, value),
    template,
  );
}

const basePrompt = `You are an AI assistant that interacts with users and helps them perform tasks.
To help the user perform these tasks, you are able to generate UI components. You are able to display components and decide what props to pass in. However, you can not interact with, or control 'state' data.
When prompted, you will be given the existing conversation history, followed by the component to display, its description provided by the user, the shape of any props to pass in, and any other related context.
Use the conversation history and other provided context to determine what props to pass in.`;

const suggestedActionsGuidelines = `When generating suggestedActions, consider the following:
1. Each suggestion should be a natural follow-up action that would make use of an available components
2. The actionText should be phrased as a user message that would trigger the use of a specific component
3. Suggestions should be contextually relevant to what the user is trying to accomplish
4. Include 1-3 suggestions that would help the user progress in their current task
5. The label should be a clear, concise button text, while the actionText can be more detailed`;

// Version-specific base prompts
const basePromptV1 = `${basePrompt}\n${suggestedActionsGuidelines}`;
const basePromptV2 = basePrompt;

const componentHydrationPromptWithToolResponse = (
  version: "v1" | "v2",
) => `${version === "v1" ? basePromptV1 : basePromptV2}
You have received a response from a tool. Use this data to help determine what props to pass in: {toolResponseString}

{availableComponentsPrompt}

{zodTypePrompt}`;

const componentHydrationPromptWithoutToolResponse = (
  version: "v1" | "v2",
) => `${version === "v1" ? basePromptV1 : basePromptV2}
You can also use any of the provided tools to fetch data needed to pass into the component.

{availableComponentsPrompt}

{zodTypePrompt}`;

function getComponentHydrationPromptWithToolResponseTemplate(
  toolResponseString: string,
  availableComponentsPrompt: string,
  zodTypePrompt: string,
  version: "v1" | "v2" = "v1",
): PromptTemplate {
  return {
    template: componentHydrationPromptWithToolResponse(version),
    args: { toolResponseString, availableComponentsPrompt, zodTypePrompt },
    version,
  };
}

function getComponentHydrationPromptWithoutToolResponseTemplate(
  availableComponentsPrompt: string,
  zodTypePrompt: string,
  version: "v1" | "v2" = "v1",
): PromptTemplate {
  return {
    template: componentHydrationPromptWithoutToolResponse(version),
    args: { availableComponentsPrompt, zodTypePrompt },
    version,
  };
}

export function getComponentHydrationPromptTemplate(
  toolResponse: ToolResponseBody | undefined,
  availableComponents: AvailableComponents,
  version: "v1" | "v2" = "v1",
): PromptTemplate {
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

export function getAvailableComponentsPromptTemplate(
  availableComponents: AvailableComponents,
): PromptTemplate {
  const availableComponentsStr = Object.values(availableComponents)
    .map((component) => `- ${component.name}: ${component.description}`)
    .join("\n");
  return {
    template: `Available components and their descriptions:
    {availableComponents}`,
    args: { availableComponents: availableComponentsStr },
  };
}

function generateAvailableComponentsPrompt(
  availableComponents: AvailableComponents,
): string {
  const template = getAvailableComponentsPromptTemplate(availableComponents);
  return replaceTemplateVariables(template.template, template.args);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateZodTypePrompt(schema: z.ZodSchema<any>): string {
  return `
      Return a JSON object that matches the given Zod schema.
      If a field is Optional and there is no input don't include in the JSON response.
      Only use tailwind classes where it explicitly says to use them.
      ${generateFormatInstructions(schema)}
    `;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateFormatInstructions(schema: z.ZodSchema<any>): string {
  return `You must format your output as a JSON value that adheres to a given "JSON Schema" instance.

    "JSON Schema" is a declarative language that allows you to annotate and validate JSON documents.
    For example, the example "JSON Schema" instance {{"properties": {{"foo": {{"description": "a list of test words", "type": "array", "items": {{"type": "string"}}}}}}, "required": ["foo"]}}}}
    would match an object with one required property, "foo". The "type" property specifies "foo" must be an "array", and the "description" property semantically describes it as "a list of test words". The items within "foo" must be strings.
    Thus, the object {{"foo": ["bar", "baz"]}} is a well-formatted instance of this example "JSON Schema". The object {{"properties": {{"foo": ["bar", "baz"]}}}} is not well-formatted.

    Your output will be parsed and type-checked according to the provided schema instance, so make sure all fields in your output match the schema exactly and there are no trailing commas!

    Here is the JSON Schema instance your output must adhere to. Only return valid JSON Schema.
    \`\`\`json
    ${JSON.stringify(zodToJsonSchema(schema))}
    \`\`\`
    `;
}

/**
 * @param components List of available components
 * @param messageHistory Array of thread messages to provide context
 * @param suggestionCount Number of suggestions to generate
 * @param schema JSON schema for validation
 * @returns Array of system and user messages
 */
export function buildSuggestionPrompt(
  components: AvailableComponent[],
  messageHistory: ThreadMessage[] = [],
  suggestionCount: number,
  schema: string,
): Array<{ role: "system" | "user"; content: string }> {
  const hasComponents = components.length > 0;
  const systemMessage = [
    "You analyze conversations and suggest contextually relevant actions.",
    hasComponents
      ? [
          "Available components:",
          components.map((c) => `- ${c.name}: ${c.description}`).join("\n"),
        ].join("\n")
      : "No components are available. Generate suggestions for tasks that can be handled without specialized tools.",

    "Guidelines for generating suggestions:",
    "1. Each suggestion should directly build upon the user's current task or goal",
    "2. If a component is already rendered, suggest specific ways to update or modify its current props",
    "3. Also suggest related components that would complement the current component",
    "4. Focus on practical, actionable steps that demonstrate component capabilities",
    "5. Make suggestions that help users discover natural next steps without having to think",
    "6. Avoid generic suggestions - make them specific to the conversation context",
    "Your response must include a brief reflection of the user's intent and actionable suggestions.",
  ].join("\n\n");

  const userMessage = [
    messageHistory.length > 0
      ? [
          "Recent conversation context:",
          messageHistory
            .slice(-3) // Only include last 3 messages for focused context
            .map(
              (msg) =>
                `${msg.role}: ${msg.content.map((c) => ("text" in c ? c.text : "")).join("")}${
                  msg.componentDecision
                    ? `\nComponent: ${msg.componentDecision.componentName}\nProps: ${JSON.stringify(msg.componentDecision.props)}`
                    : ""
                }`,
            )
            .join("\n"),
          "",
          `Based on this conversation and components sent, generate ${suggestionCount} specific actions. Include suggestions for modifying the previous component's props and exploring related components that would enhance the user's workflow.`,
        ].join("\n")
      : `Generate ${suggestionCount} specific actions that would help explore and use the available features.`,
    "",
    "Format each suggestion as:",
    "title: A clear, concise action title",
    "detailedSuggestion: A specific action using an available component",
    "",
    [
      "Example format (adapt to actual context):",
      'title: "Show Data Quarterly"',
      'detailedSuggestion: "Update the timeRange prop from 1-month to 3-months to show quarterly trends."',
      "",
      'title: "Trend Analysis"',
      'detailedSuggestion: "Show the TrendAnalyzer component to automatically identify key patterns in your data."',
    ].join("\n"),
    "Schema for validation:",
    schema,
  ].join("\n");

  return [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ];
}
