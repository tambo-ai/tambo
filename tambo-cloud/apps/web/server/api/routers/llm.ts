import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  type LlmProviderConfig,
  llmProviderConfig,
} from "@tambo-ai-cloud/core";

export const llmRouter = createTRPCRouter({
  getLlmProviderConfig: publicProcedure.query((): LlmProviderConfig => {
    return llmProviderConfig;
  }),
});
