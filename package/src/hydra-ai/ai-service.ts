import "server-only"; // So this only runs on a server component.

import { OpenAI } from "openai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ComponentChoice } from "./model/component-choice";
import { InputContext } from "./model/input-context";
import { ChatCompletionMessageParam } from "openai/resources";

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
      "The message to be displayed to the user alongside the chosen component. Depending on the component type, and the user message, this message might include a description of why a given component was chosen, and what can be seen within it, or what it does."
    ),
});

const defaultSystemInstructions = `You are a UI/UX designer that decides what component should be rendered based on what the user interaction is.`;

export default class AIService {
  client: OpenAI;
  model: string;
  systemInstructions: string;

  constructor(
    openAIKey: string,
    model: string = "gpt-4o",
    systemInstructions: string = defaultSystemInstructions
  ) {
    this.client = new OpenAI({
      apiKey: openAIKey,
    });
    this.model = model;
    this.systemInstructions = systemInstructions;
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
          "The message to be displayed to the user alongside the chosen component. Depending on the component type, and the user message, this message might include a description of why a given component was chosen, and what can be seen within it, or what it does."
        ),
    });

    const componentNames = Object.keys(context.availableComponents);

    // console.log("context", context);

    // ToDo: We will need to chain these as two steps because otherwise the prompt needs to
    // include every components props. That would make the prompt too big and the model would
    // struggle to understand it. -- Magán

// You are an AI assistant that interacts with users and helps them to perform tasks.
// When prompted, you will be given the latest user message and a list of available components. These components will assist the user in completing their task.
// You will generate your response in steps:
// 1. Decide whether you should generate a component or not. You will output a boolean value between <shouldGenerate></shouldGenerate> tags.
// 2.1. If a component should not be generated, simply respond to the user with a message and ignore the rest of the instructions.
// 2.2. If a component should be generated, follow the instructions below.
// 3. Choose one of the available components. You will output the name of the component between <componentName></componentName> tags.
    const decisionPrompt = `You are a simple AI assistant. Your goal is to output a boolean flag (true or false) indicating whether or not a UI component should be generated.
To accomplish your task, you will be given a list of available components and the latest user message.
First you will reason about whether you think a component should be generated. Reasioning should be a single sentence and output between <reasoning></reasoning> tags.
Then you will output a boolean flag (true or false) <decision></decision> tags.
Finally, if you decide that a component should be generated, you will output the name of the component between <component></component> tags.`;

    const decisionResponse = await this.callOpenAI([
      {
        role: "system",
        content: decisionPrompt,
      },
      {
        role: "user",
        content: `<availableComponents>
  ${JSON.stringify(context.availableComponents)}
</availableComponents>
<userMessage>${context.prompt}</userMessage>`,
      },
    ]);

    console.log("response", decisionResponse);
    const shouldGenerate = decisionResponse.match(/<decision>(.*?)<\/decision>/)?.[1];
    if (shouldGenerate === "false") {
      const reasoning = decisionResponse.match(/<reasoning>(.*?)<\/reasoning>/)?.[1];
      const messagePrompt = `You are an AI assistant that interacts with users and helps them perform tasks. You have determined that you cannot generate any components to help the user with their latest query for the following reason:
<reasoning>${reasoning}</reasoning>.
<availableComponents>
  ${componentNames.join(", ")}
</availableComponents>
Respond to the user's latest query to the best of your ability. If they have requested a task that you cannot help with, tell them so and recommend something you can help with.
This response should be short and concise.`;

      const messageResponse = await this.callOpenAI([
        {
          role: "system",
          content: messagePrompt,
        },
        {
          role: "user",
          content: context.prompt,
        },
      ]);

      console.log("messageResponse", messageResponse);

      return {
        componentName: null,
        props: null,
        message: messageResponse,
      };
    } else if (shouldGenerate === "true") {
      const componentName = decisionResponse.match(/<component>(.*?)<\/component>/)?.[1];

      if (!componentName) {
        throw new Error("Invalid component name");
      }

      console.log("componentName", componentName);

      const component = context.availableComponents[componentName];

      if (!component) {
        throw new Error(`Component ${componentName} not found`);
      }

      const generateComponentPrompt = `You are an AI assistant that interacts with users and helps them perform tasks.
To help the user perform these tasks, you are able to generate UI components. You are able to display components and decide what props to pass in. However, you can not interact with, or control 'state' data.
When prompted, you will be told the component to display, a description of any props to pass in, and any other related context.
You will also be given a user message. Use the user message to determine what props to pass in.

${this.generateZodTypePrompt(schema)}`;

      const generateComponentResponse = await this.callOpenAI([
        {
          role: "system",
          content: generateComponentPrompt,
        },
        {
          role: "user",
          content: `<componentName>${componentName}</componentName>
<expectedProps>${JSON.stringify(component.props)}</expectedProps>
<context>${component.context}</context>
<userMessage>${context.prompt}</userMessage>`,
        },
      ]);

      console.log("generateComponentResponse", generateComponentResponse);

      const parsedResponse = await this.parseAndReturnData(schema, generateComponentResponse);

      console.log("parsedResponse", parsedResponse);
      return parsedResponse;
    } else {
      // TODO: Handle this case. Maybe repeat the decision prompt.
      throw new Error("Invalid decision");
    }

    // const prompt = `
      
    //   Here is the list of available components with their props:
    //   ${JSON.stringify(context.availableComponents)}
    //   ${this.generateZodTypePrompt(schema)} 
    //   The latest user message is: ${context.prompt}
    // `;

    // const response = await this.callStructuredOpenAI(
    //   prompt,
    //   `You are an AI assistant that can respond to the user with text and UI components. 
    //   As of now, with components you only have the ability to determine which ones to use and the data passed in, so you cannot control any 'state' data.
    //   For example, if you show a todo item, and the user asks you to mark it as done, make sure to note that not 'behind the scenes' data is actually updated.`,
    //   schema
    // );


    // return {
    //   componentName: response.componentName,
    //   props: response.props,
    //   message: response.message,
    // };
  };

  private generateSystemPrompt = (
    context: InputContext,
    systemInstructionPrompt: string,
    schema: z.ZodSchema<any>
  ): string => {
    return `
      ${systemInstructionPrompt}
      You have a list of available components, and you should choose one of them.
      Each component has a name and a set of props that you can use.
      Here is the list of available components with their props:
      ${JSON.stringify(context.availableComponents)}
      ${this.generateZodTypePrompt(schema)} 
    `;
  };

  async callStructuredOpenAI(
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodSchema<any>
  ): Promise<any> {
    const responseContent = await this.callOpenAI(
      [
        {
          role: "system",
          content: "You only respond in JSON." + systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      true
    );
    return await this.parseAndReturnData(schema, responseContent);
  }

  async callOpenAI(
    messages: ChatCompletionMessageParam[],
    jsonMode: boolean = false,
    temperature: number = 0.7
  ): Promise<string> {
    // console.log("messages", messages);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages,
      temperature: temperature,
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

  generateZodTypePrompt(schema: z.ZodSchema<any>): string {
    return `
      Return a JSON object that matches the given Zod schema.
      If a field is Optional and there is no input don't include in the JSON response.
      Only use tailwinds classes where it explicitly says to use them.
      ${this.generateFormatInstructions(schema)}
    `;
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
}
