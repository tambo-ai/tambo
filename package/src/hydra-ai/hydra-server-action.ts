"use server";

import HydraBackend from "./hydra-ai-backend";
import { ComponentChoice } from "./model/component-choice";
import { ComponentMetadata } from "./model/component-metadata";

let hydraBackend: HydraBackend | null;

export default async function chooseComponent(
  message: string,
  availableComponents: ComponentMetadata[],
  systemInstructions?: string
): Promise<ComponentChoice> {
  const hydra = getHydraBackend(systemInstructions);
  const response = await hydra.generateComponent(message, availableComponents);
  return response;
}

const getHydraBackend = (systemInstructions?: string): HydraBackend => {
  if (!hydraBackend) {
    hydraBackend = new HydraBackend(
      process.env.OPENAI_API_KEY ?? "",
      "gpt-4o",
      systemInstructions
    );
  }
  return hydraBackend;
};
