import "server-only";
import AIService from "./ai-service";
import { InputContext } from "./model/input-context";

export default class HydraBackend {
  private aiService: AIService;

  constructor(openAIKey: string, openAIModel = "gpt-4o") {
    this.aiService = new AIService(openAIKey, openAIModel);
  }

  public async generateComponent(
    message: string,
    availableComponents: { componentName: string; props: any }[]
  ): Promise<{ componentName: string; props: any }> {
    const context: InputContext = {
      chatMessage: message,
      availableComponents,
    };

    const componentChoice = await this.aiService.chooseComponent(context);

    return componentChoice;
  }
}

export const hydraBackend = new HydraBackend(process.env.OPENAI_API_KEY!);
