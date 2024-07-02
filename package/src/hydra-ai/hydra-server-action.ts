"use server";

import HydraBackend from "./hydra-ai-backend";
import { ComponentChoice } from "./model/component-choice";

let hydra: HydraBackend | null;

export default async function chooseComponent(
  message: string,
  availableComponents: { componentName: string; props: any }[]
): Promise<ComponentChoice> {
  if (!hydra) {
    hydra = new HydraBackend(process.env.OPENAI_API_KEY ?? "");
  }
  const response = await hydra.generateComponent(message, availableComponents);
  return response;
}
