import "server-only"; // So this only runs on a server component.

import { OpenAI } from "openai";
import {
  ChatCompletion,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ComponentDecision, ToolCallRequest } from "./model/component-choice";
import {
  AvailableComponent,
  ComponentContextToolMetadata,
} from "./model/component-metadata";
import { InputContext } from "./model/input-context";
import { OpenAIResponse } from "./model/openai-response";

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

  chooseComponent = async (
    context: InputContext
  ): Promise<ComponentDecision> => {
    const componentNames = Object.keys(context.availableComponents);

    const decisionPrompt = `You are a simple AI assistant. Your goal is to output a boolean flag (true or false) indicating whether or not a UI component should be generated.
To accomplish your task, you will be given a list of available components and the latest user message.
First you will reason about whether you think a component should be generated. Reasoning should be a single sentence and output between <reasoning></reasoning> tags.
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

    const shouldGenerate = decisionResponse.message.match(
      /<decision>(.*?)<\/decision>/
    )?.[1];

    if (shouldGenerate === "false") {
      const reasoning = decisionResponse.message.match(
        /<reasoning>(.*?)<\/reasoning>/
      )?.[1];

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

      return {
        componentName: null,
        props: null,
        message: messageResponse.message,
      };
    } else if (shouldGenerate === "true") {
      const componentName = decisionResponse.message.match(
        /<component>(.*?)<\/component>/
      )?.[1];

      if (!componentName) {
        throw new Error("Invalid component name");
      }

      const component = context.availableComponents[componentName];

      if (!component) {
        throw new Error(`Component ${componentName} not found`);
      }

      return this.hydrateComponent(context.prompt, component);
    } else {
      // TODO: Handle this case. Maybe repeat the decision prompt.
      throw new Error("Invalid decision");
    }
  };

  async hydrateComponent(
    message: string,
    component: AvailableComponent,
    toolResponse?: any
  ): Promise<ComponentDecision> {
    const generateComponentPrompt = `You are an AI assistant that interacts with users and helps them perform tasks.
To help the user perform these tasks, you are able to generate UI components. You are able to display components and decide what props to pass in. However, you can not interact with, or control 'state' data.
When prompted, you will be told the component to display, a description of any props to pass in, and any other related context.
You will also be given a user message. Use the user message and the provided context to determine what props to pass in.
${
  toolResponse
    ? `You have received a response from a tool. Use this data to help determine what props to pass in: ${JSON.stringify(
        toolResponse
      )}`
    : `You can also use any of the provided tools to fetch data needed to pass into the component.`
}

${this.generateZodTypePrompt(schema)}`;

    const tools = toolResponse
      ? undefined
      : this.openAIToolFromMetadata(component.contextTools);

    const generateComponentResponse = await this.callOpenAI(
      [
        {
          role: "system",
          content: generateComponentPrompt,
        },
        {
          role: "user",
          content: `<componentName>${component.name}</componentName>
<expectedProps>${JSON.stringify(component.props)}</expectedProps>
<userMessage>${message}</userMessage>
${
  toolResponse && `<toolResponse>${JSON.stringify(toolResponse)}</toolResponse>`
}`,
        },
      ],
      tools,
      true
    );

    const componentDecision: ComponentDecision = {
      message: "Fetching additional data",
      componentName: component.name,
      props: null,
      toolCallRequest: generateComponentResponse.toolCallRequest,
    };

    if (!componentDecision.toolCallRequest) {
      const parsedData = await this.parseAndReturnData(
        schema,
        generateComponentResponse.message
      );

      componentDecision.componentName = parsedData.componentName;
      componentDecision.props = parsedData.props;
      componentDecision.message = parsedData.message;
    }

    return componentDecision;
  }

  async callOpenAI(
    messages: ChatCompletionMessageParam[],
    tools?: ChatCompletionTool[],
    jsonMode: boolean = false
  ): Promise<OpenAIResponse> {
    let componentTools = tools;
    if (tools?.length === 0) {
      componentTools = undefined;
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages,
      temperature: 0.7,
      response_format: jsonMode ? { type: "json_object" } : undefined,
      tools: componentTools,
    });

    const openAIResponse: OpenAIResponse = {
      message: response.choices[0].message.content || "",
    };

    if (
      response.choices[0].finish_reason === "function_call" ||
      response.choices[0].finish_reason === "tool_calls"
    ) {
      openAIResponse.toolCallRequest =
        this.toolCallRequestFromOpenaiResponse(response);
    }

    return openAIResponse;
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

  openAIToolFromMetadata(
    toolsMetadata: ComponentContextToolMetadata[]
  ): ChatCompletionTool[] {
    const tools: ChatCompletionTool[] = toolsMetadata.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object",
          properties: {
            ...Object.fromEntries(
              tool.parameters.map((parameter) => [
                parameter.name,
                {
                  type: parameter.type,
                },
              ])
            ),
          },
          required: [
            ...tool.parameters
              .filter((parameter) => parameter.isRequired)
              .map((parameter) => parameter.name),
          ],
          additionalProperties: false,
        },
      },
    }));
    return tools;
  }

  toolCallRequestFromOpenaiResponse = (
    response: ChatCompletion
  ): ToolCallRequest => {
    if (!response.choices[0].message.tool_calls) {
      throw new Error("No tool calls found in response");
    }
    const toolArgs = JSON.parse(
      response.choices[0].message.tool_calls[0].function.arguments
    );

    return {
      toolName: response.choices[0].message.tool_calls[0].function.name,
      parameters: [
        ...Object.entries(toolArgs).map(([key, value]) => ({
          parameterName: key,
          parameterValue: value,
        })),
      ],
    };
  };

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
