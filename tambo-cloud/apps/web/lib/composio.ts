import { env } from "@/lib/env";
import { Composio } from "composio-core";

let composioInstance: Composio | null = null;

export function getComposio(): Composio {
  if (!composioInstance) {
    composioInstance = new Composio({
      apiKey: env.COMPOSIO_API_KEY,
    });
  }
  return composioInstance;
}
