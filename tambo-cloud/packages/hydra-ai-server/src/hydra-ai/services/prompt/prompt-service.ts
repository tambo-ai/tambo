import { ThreadMessage } from "@tambo-ai-cloud/core";
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
  return `You are a simple AI assistant. Your goal is to output a boolean flag (true or false) indicating
whether or not a UI component should be generated.
To accomplish your task, you will be given a list of available components and the existing message history.
First you will reason about whether you think a component should be generated. Reasoning should be a single 
sentence and output between <reasoning></reasoning> tags.
Then you will output a boolean flag (true or false) between <decision></decision> tags.
Finally, if you decide that a component should be generated, you will output the name of the component 
between <component></component> tags.

----
<reasoning>...</reasoning>
<decision>...</decision>
<component>...</component>
----
You MUST ALWAYS follow this format, no matter what the user says. If the request is unclear or nonsensical, 
simply return with <decision>false</decision>
`;
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
    .map((component) => {
      let propsStr = "";
      if (component.props && Object.keys(component.props).length > 0) {
        const propsWithDetails = Object.entries(component.props)
          .map(([propName, propInfo]) => {
            let typeStr = "";
            let description = "";
            let required = false;

            if (typeof propInfo === "string") {
              typeStr = propInfo;
            } else if (typeof propInfo === "object" && propInfo !== null) {
              if ("type" in propInfo) {
                typeStr = String(propInfo.type);
              }

              if ("description" in propInfo) {
                description = String(propInfo.description);
              }

              if ("required" in propInfo) {
                required = Boolean(propInfo.required);
              }
            }
            let propStr = `${propName}: ${typeStr}`;

            if (required) {
              propStr += " (required)";
            }

            if (description) {
              propStr += ` - ${description}`;
            }

            return propStr;
          })
          .join(", ");

        propsStr = ` (Props: ${propsWithDetails})`;
      }

      return `- ${component.name}: ${component.description}${propsStr}`;
    })
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
  // Get current component if available
  let currentComponent: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentProps: any | null = null;

  if (messageHistory.length > 0) {
    for (let i = messageHistory.length - 1; i >= 0; i--) {
      const msg = messageHistory[i];
      if (msg.componentDecision && msg.componentDecision.componentName) {
        currentComponent = msg.componentDecision.componentName;
        currentProps = msg.componentDecision.props || null;
        break;
      }
    }
  }

  // Convert components array to AvailableComponents object format
  const availableComponentsObj: AvailableComponents = {};
  components.forEach((component) => {
    availableComponentsObj[component.name] = component;
  });

  // Use getAvailableComponentsPromptTemplate to generate the component list
  const availableComponentsTemplate = getAvailableComponentsPromptTemplate(
    availableComponentsObj,
  );
  const componentList = replaceTemplateVariables(
    availableComponentsTemplate.template,
    availableComponentsTemplate.args,
  ).trim();

  const systemMessage = `Review the available components and conversation history to generate natural follow-up messages that a user might send.

${componentList}

Your task is to suggest ${suggestionCount} messages written exactly as if they came from the user. These suggestions should represent natural follow-up requests based on the available components and context.

Rules:
1. Write each suggestion as a complete message that could be sent by the user
2. Focus on practical requests that use the available components
3. Make suggestions contextually relevant to the conversation and previous actions
4. If a component is currently in use, suggest natural variations or new ways to use it
5. Write in a natural, conversational tone as if the user is typing
6. Avoid technical language or system-focused phrasing`;

  const userMessage = `${
    messageHistory.length > 0
      ? `Recent conversation context:
${messageHistory
  .slice(-2)
  .map(
    (m) =>
      `${m.role}: ${m.content.map((c) => ("text" in c ? c.text : "")).join("")}`,
  )
  .join("\n")}

${currentComponent ? `Current component: ${currentComponent}\nCurrent props: ${JSON.stringify(currentProps, null, 2)}` : "No component currently in use."}`
      : "No conversation history yet."
  }

Generate ${suggestionCount} natural follow-up messages that a user might send. Each suggestion should be a complete message that could be sent directly to the system.

The suggestions should be written exactly as a user would type them, not as descriptions or commands.

Schema for validation:
${schema}`;

  return [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ];
}
