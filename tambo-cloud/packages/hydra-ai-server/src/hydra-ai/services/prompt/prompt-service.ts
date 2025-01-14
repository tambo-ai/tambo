import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AvailableComponents } from "../../model/component-metadata";
import { schema } from "./schemas";

export class PromptService {
  public readonly schema = schema;

  generateDecisionPrompt(): string {
    return `You are a simple AI assistant. Your goal is to output a boolean flag (true or false) indicating whether or not a UI component should be generated.
To accomplish your task, you will be given a list of available components and the existing message history.
First you will reason about whether you think a component should be generated. Reasoning should be a single sentence and output between <reasoning></reasoning> tags.
Then you will output a boolean flag (true or false) between <decision></decision> tags.
Finally, if you decide that a component should be generated, you will output the name of the component between <component></component> tags.`;
  }

  generateNoComponentPrompt(
    reasoning: string,
    availableComponents: AvailableComponents,
  ): string {
    return `You are an AI assistant that interacts with users and helps them perform tasks. You have determined that you cannot generate any components to help the user with their latest query for the following reason:
<reasoning>${reasoning}</reasoning>.
<availableComponents>
${this.generateAvailableComponentsPrompt(availableComponents)}
</availableComponents>
Respond to the user's latest query to the best of your ability. If they have requested a task that you cannot help with, tell them so and recommend something you can help with.
This response should be short and concise.`;
  }

  generateComponentHydrationPrompt(
    toolResponse: any | undefined,
    availableComponents: AvailableComponents,
  ): string {
    return `You are an AI assistant that interacts with users and helps them perform tasks.
To help the user perform these tasks, you are able to generate UI components. You are able to display components and decide what props to pass in. However, you can not interact with, or control 'state' data.
When prompted, you will be given the existing conversation history, followed by the component to display, its description provided by the user, the shape of any props to pass in, and any other related context.
Use the conversation history and other provided context to determine what props to pass in.
${
  toolResponse
    ? `You have received a response from a tool. Use this data to help determine what props to pass in: ${JSON.stringify(toolResponse)}`
    : `You can also use any of the provided tools to fetch data needed to pass into the component.`
}

When generating suggestedActions, consider the following:
1. Each suggestion should be a natural follow-up action that would make use of an available components
2. The actionText should be phrased as a user message that would trigger the use of a specific component
3. Suggestions should be contextually relevant to what the user is trying to accomplish
4. Include 1-3 suggestions that would help the user progress in their current task
5. The label should be a clear, concise button text, while the actionText can be more detailed

${this.generateAvailableComponentsPrompt(availableComponents)}

${this.generateZodTypePrompt(schema)}`;
  }

  generateAvailableComponentsPrompt(
    availableComponents: AvailableComponents,
  ): string {
    return `
    Available components and their descriptions:
    ${Object.values(availableComponents)
      .map((component) => `- ${component.name}: ${component.description}`)
      .join("\n")}
    `;
  }

  private generateZodTypePrompt(schema: z.ZodSchema<any>): string {
    return `
      Return a JSON object that matches the given Zod schema.
      If a field is Optional and there is no input don't include in the JSON response.
      Only use tailwind classes where it explicitly says to use them.
      ${this.generateFormatInstructions(schema)}
    `;
  }

  private generateFormatInstructions(schema: z.ZodSchema<any>): string {
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
}
