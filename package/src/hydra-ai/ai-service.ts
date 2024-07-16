import "server-only"; // So this only runs on a server component.

import { OpenAI } from "openai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ComponentChoice } from "./model/component-choice";
import { InputContext } from "./model/input-context";

export default class AIService {
  client: OpenAI;
  model: string;

  constructor(openAIKey: string, model: string = "gpt-4o") {
    this.client = new OpenAI({
      apiKey: openAIKey,
    });
    this.model = model;
  }

  chooseComponent = async (context: InputContext): Promise<ComponentChoice> => {
    const schema = z.object({
      componentName: z.string().describe("The name of the chosen component"),
      props: z
        .object({})
        .passthrough()
        .describe(
          "The props that should be used in the chosen component. These will be injected by using React.createElement(component, props)"
        ),
      message: z
        .string()
        .describe(
          "The message to be displayed to the user alongside the chosen component."
        ),
    });

    // ToDo: We will need to chain these as two steps because otherwise the prompt needs to
    // include every components props. That would make the prompt too big and the model would
    // struggle to understand it. -- Magán
    const prompt = `
      You are a UI/UX designer that decides what component should be rendered based on what the user interaction is.
      You have a list of available components, and you should choose one of them.
      Each component has a name and a set of props that you can use.
      Here is the list of available components with their props:
      ${JSON.stringify(context.availableComponents)}
      ${this.generateZodTypePrompt(schema)} 
      The latest user message is: ${context.prompt}
    `;

    const response = await this.callStructuredOpenAI(
      prompt,
      `You are an AI assistant that can respond to the user with text and UI components. 
      As of now, with components you only have the ability to determine which ones to use and the data passed in, so you cannot control any 'state' data.
      For example, if you show a todo item, and the user asks you to mark it as done, make sure to note that not 'behind the scenes' data is actually updated.`,
      schema
    );

    return {
      componentName: response.componentName,
      props: response.props,
      message: response.message,
    };
  };

  async callStructuredOpenAI(
    prompt: string,
    content: string,
    schema: z.ZodSchema<any>
  ): Promise<any> {
    const responseContent = await this.callOpenAI(
      prompt,
      "You only respond in JSON." + content,
      true
    );
    return await this.parseAndReturnData(schema, responseContent);
  }

  async callOpenAI(
    userPrompt: string,
    systemPrompt: string,
    jsonMode: boolean = false
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      response_format: jsonMode ? { type: "json_object" } : undefined,
    });

    const responseContent = response.choices[0].message.content || "";
    return responseContent;
  }

  async parseAndReturnData<T extends z.ZodTypeAny>(
    schema: T,
    text: string | object
  ): Promise<z.infer<T>> {
    try {
      let json;
      if (typeof text === "string") {
        json = text.trim();
        json = JSON.parse(json);
      } else {
        json = text;
      }
      const parsedData = await schema.parseAsync(json);
      return parsedData;
    } catch (e) {
      console.error(
        `Failed to parse. Text: "${
          typeof text === "string" ? text : JSON.stringify(text)
        }". Error: ${e}`
      );
      throw new Error(
        `Failed to parse. Text: "${
          typeof text === "string" ? text : JSON.stringify(text)
        }". Error: ${e}`
      );
    }
  }

  generateFormatInstructions(schema: any): string {
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

  generateZodTypePrompt(schema: z.ZodSchema<any>): string {
    return `
      Return a JSON object that matches the given Zod schema.
      If a field is Optional and there is no input don't include in the JSON response.
      Only use tailwinds classes where it explicitly says to use them.
      ${this.generateFormatInstructions(schema)}
    `;
  }
}
