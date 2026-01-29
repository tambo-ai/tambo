import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = import.meta.env.VITE_DATABASE_URL;

if (!connectionString) {
  throw new Error("VITE_DATABASE_URL is not set");
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
