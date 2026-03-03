"use client";
import * as Devtools from "./tambo-devtools";

export type { TamboDevtoolsProps } from "./tambo-devtools";

export const TamboDevtools: (typeof Devtools)["TamboDevtools"] =
  process.env.NODE_ENV !== "development"
    ? () => null // Render nothing in production
    : Devtools.TamboDevtools;
