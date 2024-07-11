"use server";

import HydraBackend from "./hydra-ai-backend";
import { ComponentChoice } from "./model/component-choice";
import { ComponentMetadata } from "./model/component-metadata";

let hydra: HydraBackend | null;

export default async function chooseComponent(
  message: string,
  availableComponents: ComponentMetadata[]
): Promise<ComponentChoice> {
  if (!hydra) {
    hydra = new HydraBackend(process.env.OPENAI_API_KEY ?? "");
  }
  const response = await hydra.generateComponent(message, availableComponents);
  return response;
}
