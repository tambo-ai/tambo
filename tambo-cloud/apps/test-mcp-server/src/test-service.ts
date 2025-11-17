import { type McpService } from "./mcp-service.js";
import { testPrompts } from "./test-prompts.js";
import { testHandlers, testTools } from "./test-tools.js";

// Test service implementation
export const testService: McpService = {
  name: "test",
  tools: testTools,
  handlers: testHandlers,
  prompts: testPrompts,
};
