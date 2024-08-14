"use server";

import HydraBackend from "./hydra-ai-backend";
import { ComponentChoice } from "./model/component-choice";
import { ComponentMetadata } from "./model/component-metadata";
import { ComponentPropsMetadata } from "./model/component-props-metadata";

let hydraBackend: HydraBackend | null;

const getHydraBackend = (systemInstructions?: string): HydraBackend => {
  if (!hydraBackend) {
    hydraBackend = new HydraBackend(
      process.env.POSTGRES_DB_URL ?? "",
      process.env.OPENAI_API_KEY ?? "",
      "gpt-4o",
    );
  }
  return hydraBackend;
};
export async function chooseComponent(
  message: string,
  availableComponents: ComponentMetadata[],
): Promise<ComponentChoice> {
  const hydra = getHydraBackend();
  const response = await hydra.generateComponent(message, availableComponents);
  return response;
}

export async function saveComponent(
  name: string,
  description: string,
  propsDefinition: ComponentPropsMetadata
): Promise<boolean> {
  const hydra = getHydraBackend();
  const success = await hydra.registerComponent(name, description, propsDefinition);
  return success;
}