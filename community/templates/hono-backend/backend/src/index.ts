import { Hono } from "hono";
import { cors } from "hono/cors";
import { createServer } from "node:http";
import { bookmarksRouter } from "./routes/bookmarks.js";
import { logger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { initDatabase } from "./db/database.js";

// Initialize database
initDatabase();

const app = new Hono();

// Global middleware
app.use("*", errorHandler);
app.use("*", logger);

app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.route("/api/bookmarks", bookmarksRouter);

// eslint-disable-next-line turbo/no-undeclared-env-vars
const port = Number(process.env.BACKEND_PORT) || 3001;

const server = createServer(async (req, res) => {
  const url = `http://${req.headers.host}${req.url}`;

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks).toString();
  }

  const request = new Request(url, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body,
  });

  const response = await app.fetch(request);
  const responseBody = await response.text();

  res.writeHead(
    response.status,
    Object.fromEntries(response.headers.entries()),
  );
  res.end(responseBody);
});

server.listen(port, () => {
  console.log(`\n🚀 Hono server running on http://localhost:${port}`);
  console.log(`📝 Health check: http://localhost:${port}/health`);
  console.log(`🔖 Bookmarks API: http://localhost:${port}/api/bookmarks\n`);
});
