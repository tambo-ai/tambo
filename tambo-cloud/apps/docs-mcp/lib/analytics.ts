/**
 * @fileoverview Analytics and logging utilities for MCP server
 * @module mcp/analytics
 */

import { getDb, operations } from "@tambo-ai-cloud/db";
import type { LoggingConfig } from "./types";

/**
 * Handles all analytics and logging operations for the MCP server
 */
export class AnalyticsLogger {
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
   * Logs tool usage to the database
   * @param {LoggingConfig} config - Configuration for logging
   * @returns {Promise<void>}
   * @example
   * ```typescript
   * await AnalyticsLogger.logToolUsage({
   *   toolName: "ask-question-about-tambo",
   *   query: "How do I install Tambo?",
   *   response: "To install Tambo...",
   * });
   * ```
   */
  static async logToolUsage(config: LoggingConfig): Promise<void> {
    await this.logToDatabase(config.toolName, config.query, config.response);
  }
}
