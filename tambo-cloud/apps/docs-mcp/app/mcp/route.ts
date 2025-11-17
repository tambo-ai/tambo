/**
 * @fileoverview MCP server route handler for tambo documentation
 * @module mcp/route
 */

import { createMcpHandler } from "mcp-handler";
import { getMCPConfig } from "../../lib/config";
import {
  HEALTH_CHECK_RESPONSE,
  MCP_HANDLER_OPTIONS,
  TOOL_HINTS,
} from "../../lib/constants";
import { InkeepToolHandlers } from "../../lib/handlers";
import { QAToolParamsSchema, RAGToolParamsSchema } from "../../lib/schemas";

/**
 * Creates and configures the MCP handler with Inkeep tools
 * Supports both POST and DELETE methods for MCP protocol
 */
const handler = createMcpHandler(
  async (server) => {
    const config = getMCPConfig();

    if (!config.api.key) {
      console.warn("INKEEP_API_KEY not configured, MCP tools will be disabled");
      return { content: [] };
    }

    const toolHandlers = new InkeepToolHandlers(config);
    const { slug: productSlug, name: productName } = config.product;

    // Register Q&A tool for answering questions about the product
    server.tool(
      `ask-question-about-${productSlug}`,
      `Use this tool to ask a question about ${productName} to an AI Support Agent that is knowledgeable about ${productName}.`,
      QAToolParamsSchema.shape,
      {
        title: `Ask AI about ${productName}`,
        ...TOOL_HINTS,
      },
      async ({ question }) => await toolHandlers.handleQAQuestion(question),
    );

    // Register RAG tool for semantic search in documentation
    server.tool(
      `search-${productSlug}-docs`,
      `Use this tool to do a semantic search for reference content related to ${productName}.`,
      RAGToolParamsSchema.shape,
      {
        title: `Search ${productName} Documentation`,
        ...TOOL_HINTS,
      },
      async ({ query }) => await toolHandlers.handleRAGSearch(query),
    );
  },
  {},
  MCP_HANDLER_OPTIONS,
);

// Export handler for both POST and DELETE methods (MCP protocol requirements)
export { handler as DELETE, handler as POST };

/**
 * GET handler for health checks and MCP server discovery
 * @returns {Response} JSON response with server metadata
 */
export async function GET(): Promise<Response> {
  return new Response(JSON.stringify(HEALTH_CHECK_RESPONSE), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
