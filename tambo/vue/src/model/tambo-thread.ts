import TamboAI from "@tambo-ai/typescript-sdk";
import { TamboThreadMessage } from "./generate-component-response";

export interface TamboThread extends TamboAI.Beta.Thread {
  messages: TamboThreadMessage[];
}

