import "server-only";
import AIService from "./ai-service";
import { ComponentChoice } from "./model/component-choice";
import { ComponentMetadata } from "./model/component-metadata";
import { InputContext } from "./model/input-context";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { registeredComponents } from "../db/schema";
import { ComponentPropsMetadata } from "./model/component-props-metadata";

export default class HydraBackend {
  private aiService: AIService;
  private dbConnection: NodePgDatabase;

  constructor(dbConnectionUrl: string, openAIKey: string, openAIModel = "gpt-4o") {
    const pool = new Pool({
      connectionString: dbConnectionUrl,
    });
  
    this.dbConnection = drizzle(pool);
    this.aiService = new AIService(openAIKey, openAIModel);
  }

  public async registerComponent(
    name: string,
    description: string,
    propsDefinition?: ComponentPropsMetadata
  ): Promise<boolean> {
    try {
      let _ = await this.dbConnection.insert(registeredComponents).values({
        name,
        description,
        prop_definitions: propsDefinition,
      });

      return true;
    } catch (error: any) {
      if (error.code === "23505") {
        // Component already registered in DB
        return true;
      }

      throw error;
    }
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
