import { z } from "zod/v3";

export const skillNameSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Must be kebab-case (e.g. scheduling-assistant)",
  );

export const createSkillInput = z.object({
  projectId: z.string(),
  name: skillNameSchema,
  description: z.string().min(1).max(500),
  instructions: z.string().min(1).max(4000),
});

export const updateSkillInput = z.object({
  projectId: z.string(),
  skillId: z.string(),
  name: skillNameSchema.optional(),
  description: z.string().min(1).max(500).optional(),
  instructions: z.string().min(1).max(4000).optional(),
  enabled: z.boolean().optional(),
});

export const getSkillInput = z.object({
  projectId: z.string(),
  skillId: z.string(),
});

export const listSkillsInput = z.object({
  projectId: z.string(),
});

export const deleteSkillInput = z.object({
  projectId: z.string(),
  skillId: z.string(),
});
