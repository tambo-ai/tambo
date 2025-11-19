/**
 * @fileoverview Tool handlers for MCP server operations
 * @module mcp/handlers
 */

import * as Sentry from "@sentry/nextjs";
import { OpenAI } from "openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { AnalyticsLogger } from "./analytics";
import type { MCPConfig } from "./config";
import { InkeepRAGResponseSchema } from "./schemas";
import type { MCPToolResponse, RAGDocument } from "./types";

/**
 * Handles Inkeep tool operations for Q&A and RAG search
 */
export class InkeepToolHandlers {
  private openai: OpenAI;
  private config: MCPConfig;

  /**
   * Creates an instance of InkeepToolHandlers
   * @param {MCPConfig} config - MCP server configuration
   */
  constructor(config: MCPConfig) {
    this.config = config;
    this.openai = new OpenAI({
      baseURL: config.api.baseUrl,
      apiKey: config.api.key,
    });
  }

  /**
   * Handles Q&A questions using the Inkeep QA model
   * @param {string} question - The question to answer
   * @returns {Promise<MCPToolResponse>} The formatted response
   * @example
   * ```typescript
   * const handler = new InkeepToolHandlers(config);
   * const response = await handler.handleQAQuestion("How do I install Tambo?");
   * ```
   */
  async handleQAQuestion(question: string): Promise<MCPToolResponse> {
    const toolName = `ask-question-about-${this.config.product.slug}`;

    return await Sentry.startSpan(
      {
        name: "inkeep-qa-request",
        op: "ai.chat_completions",
        attributes: {
          "ai.model": this.config.models.qa,
          "ai.prompt.tokens": question.length,
        },
      },
      async () => {
        try {
          const response = await this.openai.chat.completions.create({
            model: this.config.models.qa,
            messages: [{ role: "user", content: question }],
          });

          const qaResponse = response.choices[0].message.content;

          if (!qaResponse) {
            return { content: [] };
          }

          // Log usage asynchronously to avoid blocking the response
          this.logQAUsage(toolName, question, qaResponse).catch(console.error);

          return {
            content: [{ type: "text" as const, text: qaResponse }],
          };
        } catch (error) {
          Sentry.captureException(error);
          console.error("Error getting QA response:", error);
          return { content: [] };
        }
      },
    );
  }

  /**
   * Handles RAG search queries for documentation
   * @param {string} query - The search query
   * @returns {Promise<MCPToolResponse>} The formatted search results
   * @example
   * ```typescript
   * const handler = new InkeepToolHandlers(config);
   * const results = await handler.handleRAGSearch("authentication setup");
   * ```
   */
  async handleRAGSearch(query: string): Promise<MCPToolResponse> {
    const toolName = `search-${this.config.product.slug}-docs`;

    return await Sentry.startSpan(
      {
        name: "inkeep-rag-search",
        op: "ai.chat_completions.parse",
        attributes: {
          "ai.model": this.config.models.rag,
          "ai.prompt.tokens": query.length,
        },
      },
      async () => {
        try {
          const response = await this.openai.chat.completions.parse({
            model: this.config.models.rag,
            messages: [{ role: "user", content: query }],
            response_format: zodResponseFormat(
              InkeepRAGResponseSchema,
              "InkeepRAGResponseSchema",
            ),
          });

          const parsedResponse = response.choices[0].message.parsed;

          if (!parsedResponse) {
            return { content: [] };
          }

          const responseText = JSON.stringify(parsedResponse);

          // Log usage asynchronously to avoid blocking the response
          this.logRAGUsage(toolName, query, responseText).catch(console.error);

          return {
            content: [{ type: "text" as const, text: responseText }],
          };
        } catch (error) {
          Sentry.captureException(error);
          console.error("Error retrieving product docs:", error);
          return { content: [] };
        }
      },
    );
  }

  /**
   * Formats RAG documents into markdown links
   * @param {RAGDocument[]} content - Array of RAG documents
   * @returns {string} Formatted markdown links
   * @private
   */
  private formatRAGLinks(content: RAGDocument[]): string {
    return (
      content
        .filter((x) => x.url)
        .map((x) => `- [${x.title || x.url}](${x.url})`)
        .join("\n") || ""
    );
  }

  /**
   * Logs Q&A tool usage
   * @private
   */
  private async logQAUsage(
    toolName: string,
    question: string,
    response: string,
  ): Promise<void> {
    await AnalyticsLogger.logToolUsage({
      toolName,
      query: question,
      response,
    });
  }

  /**
   * Logs RAG search usage
   * @private
   */
  private async logRAGUsage(
    toolName: string,
    query: string,
    response: string,
  ): Promise<void> {
    await AnalyticsLogger.logToolUsage({
      toolName,
      query,
      response,
    });
  }
}
