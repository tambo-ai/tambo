import { z } from "zod";
import { ComponentPropsMetadataSchema } from "./component-props-metadata";

const InputContextSchema = z.object({
  chatMessage: z.string(),
  availableComponents: z.array(
    z.object({
      componentName: z.string(),
      props: ComponentPropsMetadataSchema,
    })
  ),
});

export type InputContext = z.infer<typeof InputContextSchema>;
