import { type McpService } from "./mcp-service.js";
import { weatherHandlers, weatherTools } from "./weather.js";

// Weather service implementation
export const weatherService: McpService = {
  name: "weather",
  tools: weatherTools,
  handlers: weatherHandlers,
};
