/**
 * @fileoverview Analytics and logging utilities for MCP server
 * @module mcp/analytics
 */

import { InkeepAnalytics } from "@inkeep/inkeep-analytics";
import type {
  CreateOpenAIConversation,
  Messages,
  UserProperties,
} from "@inkeep/inkeep-analytics/models/components";
import { getDb, operations } from "@tambo-ai-cloud/db";
import type { LoggingConfig } from "./types";

/**
 * Handles all analytics and logging operations for the MCP server
 */
export class AnalyticsLogger {
  /**
   * Logs conversation data to Inkeep Analytics
   * @param {Object} params - Logging parameters
   * @param {Messages[]} params.messagesToLogToAnalytics - Messages to log
   * @param {Record<string, unknown>} [params.properties] - Additional properties
   * @param {UserProperties} [params.userProperties] - User-specific properties
   * @returns {Promise<void>}
   * @private
   */
  private static async logToInkeep({
    messagesToLogToAnalytics,
    properties,
    userProperties,
  }: {
    messagesToLogToAnalytics: Messages[];
    properties?: Record<string, unknown> | null | undefined;
    userProperties?: UserProperties | null | undefined;
  }): Promise<void> {
    const apiKey = process.env.INKEEP_API_KEY;
    if (!apiKey) return;

    try {
      const inkeepAnalytics = new InkeepAnalytics({
        apiIntegrationKey: apiKey,
      });

      const logConversationPayload: CreateOpenAIConversation = {
        type: "openai",
        messages: messagesToLogToAnalytics,
        userProperties,
        properties,
      };

      await inkeepAnalytics.conversations.log(
        { apiIntegrationKey: apiKey },
        logConversationPayload,
      );
    } catch (err) {
      console.error("Error logging conversation to Inkeep:", err);
    }
  }

  /**
   * Logs MCP usage data to the database
   * @param {string} toolName - Name of the tool used
   * @param {string} query - Query sent to the tool
   * @param {string} response - Response from the tool
   * @returns {Promise<void>}
   * @private
   */
  private static async logToDatabase(
    toolName: string,
    query: string,
    response: string,
  ): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return;

    try {
      const db = getDb(databaseUrl);
      await operations.logMcpUsage(db, {
        transport: "http",
        toolName,
        query,
        response,
      });
    } catch (_error) {
      // Ignore DB errors in edge runtime or missing envs
      // This is expected in development or when DB is not configured
    }
  }

  /**
   * Logs tool usage to both Inkeep Analytics and database
   * @param {LoggingConfig} config - Configuration for logging
   * @returns {Promise<void>}
   * @example
   * ```typescript
   * await AnalyticsLogger.logToolUsage({
   *   toolName: "ask-question-about-tambo",
   *   query: "How do I install Tambo?",
   *   response: "To install Tambo...",
   *   analyticsMessages: [
   *     { role: "user", content: "How do I install Tambo?" },
   *     { role: "assistant", content: "To install Tambo..." }
   *   ]
   * });
   * ```
   */
  static async logToolUsage(config: LoggingConfig): Promise<void> {
    await Promise.all([
      this.logToInkeep({
        properties: { tool: config.toolName },
        messagesToLogToAnalytics: config.analyticsMessages,
      }),
      this.logToDatabase(config.toolName, config.query, config.response),
    ]);
  }
}
