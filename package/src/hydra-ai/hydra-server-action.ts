"use server";

import HydraBackend from "./hydra-ai-backend";
import { ComponentDecision } from "./model/component-choice";
import {
  AvailableComponent,
  AvailableComponents,
  ComponentContextToolMetadata,
} from "./model/component-metadata";
import { ComponentPropsMetadata } from "./model/component-props-metadata";

let hydraBackend: HydraBackend | null;

const getHydraBackend = (): HydraBackend => {
  if (!hydraBackend) {
    hydraBackend = new HydraBackend(
      process.env.POSTGRES_DB_URL ?? "",
      process.env.OPENAI_API_KEY ?? "",
      "gpt-4o"
    );
  }
  return hydraBackend;
};
export async function chooseComponent(
  message: string,
  availableComponents: AvailableComponents
): Promise<ComponentDecision> {
  const hydra = getHydraBackend();
  const response = await hydra.generateComponent(message, availableComponents);
  return response;
}

export async function saveComponent(
  name: string,
  description: string,
  propsDefinition: ComponentPropsMetadata,
  contextToolDefinitions: ComponentContextToolMetadata[]
): Promise<boolean> {
  const hydra = getHydraBackend();
  const success = await hydra.registerComponent(
    name,
    description,
    propsDefinition,
    contextToolDefinitions
  );
  return success;
}

export async function hydrateComponent(
  message: string,
  component: AvailableComponent,
  toolResponse: any
): Promise<ComponentDecision> {
  const hydra = getHydraBackend();
  const response = await hydra.hydrateComponentWithData(
    message,
    component,
    toolResponse
  );
  return response;
}
