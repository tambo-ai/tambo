import TamboAI from "@tambo-ai/typescript-sdk";

export interface TamboThread extends TamboAI.Beta.Threads.Thread {
  generationStage?: string;
  statusMessage?: string;
}

