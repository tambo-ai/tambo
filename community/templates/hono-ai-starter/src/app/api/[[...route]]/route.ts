import { Hono } from "hono";
import { handle } from "hono/vercel";

export const runtime = "edge";

const app = new Hono().basePath("/api");

app.get("/hello", (c) => {
  return c.json({
    message: "Hono is alive on the Edge!",
    timestamp: new Date().toISOString(),
  });
});

export const GET = handle(app);
export const POST = handle(app);
