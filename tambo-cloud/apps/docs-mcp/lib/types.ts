/**
 * @fileoverview Type definitions for MCP server
 * @module mcp/types
 */

/**
 * Response structure for MCP tools
 */
export interface MCPToolResponse {
  /** Content array with text responses */
  content: Array<{
    /** Content type (always "text" for our tools) */
    type: "text";
    /** The actual text content */
    text: string;
  }>;
  /** Index signature for additional properties */
  [key: string]: unknown;
}

/**
 * Configuration for logging tool usage
 */
export interface LoggingConfig {
  /** Name of the tool being logged */
  toolName: string;
  /** The query/question sent to the tool */
  query: string;
  /** The response from the tool */
  response: string;
}

/**
 * RAG document structure from Inkeep API
 */
export interface RAGDocument {
  /** Document type */
  type: string;
  /** Source metadata */
  source: Record<string, unknown>;
  /** Document title */
  title?: string | null;
  /** Additional context */
  context?: string | null;
  /** Record type identifier */
  record_type?: string | null;
  /** Document URL */
  url?: string | null;
}

/**
 * Response structure from RAG search
 */
export interface RAGResponse {
  /** Array of matching documents */
  content: RAGDocument[];
  [key: string]: unknown;
}
