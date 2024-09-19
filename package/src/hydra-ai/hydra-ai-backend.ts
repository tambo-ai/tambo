import "server-only";

import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { registeredComponents } from "../db/schema";
import AIService from "./ai-service";
import { ChatMessage } from "./model/chat-message";
import { ComponentDecision } from "./model/component-choice";
import {
  AvailableComponent,
  AvailableComponents,
  ComponentContextToolMetadata,
} from "./model/component-metadata";
import { ComponentPropsMetadata } from "./model/component-props-metadata";
import { InputContext } from "./model/input-context";

export default class HydraBackend {
  private aiService: AIService;
  private dbConnection?: NodePgDatabase;

  constructor(
    openAIKey: string,
    openAIModel = "gpt-4o",
    dbConnectionUrl?: string,
    provider:
      | "openai"
      | "mistral"
      | "anthropic"
      | "bedrock"
      | "gemini"
      | "groq"
      | "openrouter" = "openai"
  ) {
    if (dbConnectionUrl) {
      const pool = new Pool({
        connectionString: dbConnectionUrl,
      });

      this.dbConnection = drizzle(pool);
    }
    this.aiService = new AIService(openAIKey, openAIModel, provider);
  }

  public async registerComponent(
    name: string,
    description: string,
    propsDefinition?: ComponentPropsMetadata,
    contextToolDefinitions?: ComponentContextToolMetadata[]
  ): Promise<boolean> {
    if (this.dbConnection) {
      try {
        await this.dbConnection.insert(registeredComponents).values({
          name,
          description,
          prop_definitions: propsDefinition,
          context_tools: contextToolDefinitions,
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
    return true;
  }

  public async generateComponent(
    messageHistory: ChatMessage[],
    availableComponents: AvailableComponents
  ): Promise<ComponentDecision> {
    const context: InputContext = {
      messageHistory,
      availableComponents,
    };

    return this.aiService.chooseComponent(context);
  }

  public async hydrateComponentWithData(
    messageHistory: ChatMessage[],
    component: AvailableComponent,
    toolResponse: any
  ): Promise<ComponentDecision> {
    return this.aiService.hydrateComponent(
      messageHistory,
      component,
      toolResponse
    );
  }
}
