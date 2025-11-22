/**
 * @fileoverview MCP server configuration module
 * @module mcp/config
 */

/**
 * Product configuration for the MCP server
 */
export interface ProductConfig {
  /** Product slug used in tool names */
  slug: string;
  /** Human-readable product name */
  name: string;
}

/**
 * API configuration for Inkeep integration
 */
export interface ApiConfig {
  /** Base URL for the Inkeep API */
  baseUrl: string;
  /** API key for authentication */
  key?: string;
}

/**
 * Model configuration for AI models
 */
export interface ModelConfig {
  /** Model identifier for Q&A operations */
  qa: string;
  /** Model identifier for RAG operations */
  rag: string;
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  /** Database connection URL */
  url?: string;
}

/**
 * Complete MCP server configuration
 */
export interface MCPConfig {
  product: ProductConfig;
  api: ApiConfig;
  models: ModelConfig;
  database: DatabaseConfig;
}

/**
 * Gets the MCP server configuration from environment variables
 * @returns {MCPConfig} The complete configuration object
 */
export function getMCPConfig(): MCPConfig {
  return {
    product: {
      slug: "tambo",
      name: "tambo",
    },
    api: {
      baseUrl: process.env.INKEEP_API_BASE_URL || "https://api.inkeep.com/v1",
      key: process.env.INKEEP_API_KEY,
    },
    models: {
      qa: "inkeep-qa-expert",
      rag: "inkeep-rag",
    },
    database: {
      url: process.env.DATABASE_URL,
    },
  };
}
