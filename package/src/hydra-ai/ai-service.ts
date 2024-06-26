import "server-only"; // So this only runs on a server component.

import { OpenAI } from "openai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ComponentChoice } from "./model/component-choice";
import { InputContext } from "./model/input-context";

export default class AIService {
  model: OpenAI;

  constructor(openAIKey: string) {
    this.model = new OpenAI({
      apiKey: openAIKey,
    });
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
      The latest user message is: ${context.chatMessage}
    `;

    const response = await this.callStructuredOpenAI(
      prompt,
      "You are a frontend developer, designer and copywriter extraordinaire.",
      schema
    );

    return response as ComponentChoice;
  };

  async callStructuredOpenAI(
    prompt: string,
    content: string,
    schema: z.ZodSchema<any>,
    model: string = "gpt-4o"
  ): Promise<any> {
    const responseContent = await this.callOpenAI(
      prompt,
      "You only respond in JSON." + content,
      model,
      true
    );
    return await this.parseAndReturnData(schema, responseContent);
  }

  async callOpenAI(
    userPrompt: string,
    systemPrompt: string,
    model: string,
    jsonMode: boolean = false
  ): Promise<string> {
    const response = await this.model.chat.completions.create({
      model: model,
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
