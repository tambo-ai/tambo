import { Composio } from "composio-core";

let composioInstance: Composio | null = null;

export function getComposio(): Composio {
  if (!composioInstance) {
    composioInstance = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY,
    });
  }
  return composioInstance;
}
