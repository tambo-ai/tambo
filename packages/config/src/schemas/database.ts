import { z } from "zod";

/**
 * Database configuration schema.
 */
export const databaseSchema = z.object({
  /** PostgreSQL connection string */
  url: z.string().min(1).describe("PostgreSQL connection string"),
  /** Connection pool size */
  poolSize: z
    .number()
    .int()
    .positive()
    .default(10)
    .describe("Connection pool size"),
});

export type DatabaseConfig = z.infer<typeof databaseSchema>;
