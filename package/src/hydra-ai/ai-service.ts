import { ChatOpenAI } from "@langchain/openai";
import { ComponentChoice } from "./model/component-choice";
import { InputContext } from "./model/input-context";

export default class AIService {
  model: ChatOpenAI;

  constructor(openAIKey: string) {
    this.model = new ChatOpenAI({
      model: "gpt-4o",
      apiKey: openAIKey,
    });
  }

  chooseComponent = async (context: InputContext): Promise<ComponentChoice> => {
    const structuredLlm = this.model.withStructuredOutput({
      name: "choose-component",
      description:
        "Represents the choice of a React component that should be rendered based on the input message.",
      parameters: {
        title: "ComponentChoice",
        type: "object",
        properties: {
          componentName: {
            type: "string",
            description: "The name of the chosen component",
          },
          props: {
            type: "array",
            description:
              "The props that should be used in the chosen component. These will be injected by using React.createElement(component, props)",
            items: {
              type: "string",
            },
          },
        },
        required: ["componentName", "props"],
      },
    });
    const response = await structuredLlm.invoke(`
        You are a UI/UX designer that decides what component should be rendered based on what the user interaction is.
        You have a list of available components, and you should choose one of them.
        the list of available components is: ${context.availableComponentNames.join()}
        and the latest user message is: ${context.chatMessage}`);
    return response as ComponentChoice;
  };
}
