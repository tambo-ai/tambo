import TamboAI from "@tambo-ai/typescript-sdk";
import { TamboThreadMessage } from "./generate-component-response";

/**
 * An extension of the TamboAI.Beta.Thread type that includes
 * messages with renderedComponent
 */
export interface TamboThread extends TamboAI.Beta.Thread {
  messages: TamboThreadMessage[];
}
