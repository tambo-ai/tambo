import { z } from "zod";

/**
 * Schema for overriding default paths.
 * These can be set in config files to override XDG/platform defaults.
 */
export const pathsSchema = z
  .object({
    /** Override config directory */
    config: z.string().optional().describe("Override config directory path"),
    /** Override data directory */
    data: z.string().optional().describe("Override data directory path"),
    /** Override cache directory */
    cache: z.string().optional().describe("Override cache directory path"),
    /** Override state directory */
    state: z.string().optional().describe("Override state directory path"),
    /** Override temp directory */
    temp: z.string().optional().describe("Override temp directory path"),
  })
  .optional();

export type PathsConfig = z.infer<typeof pathsSchema>;
