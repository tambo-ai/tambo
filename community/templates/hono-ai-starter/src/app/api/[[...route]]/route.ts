import { Hono } from "hono";
import { handle } from "hono/vercel";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

export const runtime = "edge"; // Crucial for Tambo performance

const app = new Hono().basePath("/api");

// 1. Status Route
app.get(
  "/status",
  zValidator("query", z.object({ service: z.string().min(1) })),
  async (c) => {
    const { service } = c.req.valid("query");
    return c.json({
      title: `${service.toUpperCase()} Status`,
      status: "active",
      message: `Service ${service} is running optimally on Hono Edge.`,
    });
  },
);

// 2. Logs Route
app.get(
  "/logs",
  zValidator("query", z.object({ limit: z.string().optional() })),
  async (c) => {
    const limit = Number(c.req.query("limit")) || 3;
    const logs = [
      { id: 1, event: "Database Backup", time: "2 mins ago", type: "info" },
      { id: 2, event: "High CPU Usage", time: "15 mins ago", type: "warning" },
      { id: 3, event: "New User Registered", time: "1 hour ago", type: "info" },
    ].slice(0, limit);

    return c.json({ logs });
  },
);

export const GET = handle(app);
export const POST = handle(app);
