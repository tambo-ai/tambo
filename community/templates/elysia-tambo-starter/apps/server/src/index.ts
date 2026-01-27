import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { aiHandler } from "./ai";

const app = new Elysia()
  .use(cors())
  .get("/", () => "Tambo + Elysia AI Server is running")
  .post("/api/ai", aiHandler)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
console.log(`🔑 Tambo API Key Loaded: ${!!process.env.TAMBO_API_KEY}`);
