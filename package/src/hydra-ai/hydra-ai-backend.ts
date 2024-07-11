import "server-only";
import AIService from "./ai-service";
import { ComponentChoice } from "./model/component-choice";
import { ComponentMetadata } from "./model/component-metadata";
import { InputContext } from "./model/input-context";

export default class HydraBackend {
  private aiService: AIService;

  constructor(openAIKey: string, openAIModel = "gpt-4o") {
    this.aiService = new AIService(openAIKey, openAIModel);
  }

  public async generateComponent(
    message: string,
    availableComponents: ComponentMetadata[]
  ): Promise<ComponentChoice> {
    const context: InputContext = {
      prompt: message,
      availableComponents,
    };

    const componentChoice = await this.aiService.chooseComponent(context);

    return componentChoice;
  }
}

export const hydraBackend = new HydraBackend(process.env.OPENAI_API_KEY!);
