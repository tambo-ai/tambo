"use server";

import Hydra from "hydra-ai";
import { ReactElement } from "react";
import { initHydra } from "./hydra";

let hydra: Hydra | null;

export const generateDynamicMessage = async (
  message: string
): Promise<ReactElement> => {
  if (!hydra) {
    hydra = initHydra(process.env.OPENAI_API_KEY ?? "");
  }
  const response = await hydra.generateComponent(message);
  return response;
};
