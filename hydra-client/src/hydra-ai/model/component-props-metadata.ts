import { z } from "zod";

export const ComponentPropsMetadataSchema = z.any();
export type ComponentPropsMetadata = z.infer<
  typeof ComponentPropsMetadataSchema
>;
