import assert from "node:assert/strict";
import test from "node:test";

import { createMcpCorsMiddleware, isAllowedCorsOrigin } from "./src/cors.js";

function createResponse() {
  const headers = new Map();

  return {
    body: undefined,
    headers,
    statusCode: 200,
    send(body) {
      this.body = body;
      return this;
    },
    sendStatus(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    setHeader(name, value) {
      headers.set(name.toLowerCase(), value);
      return this;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    vary(field) {
      headers.set("vary", field);
      return this;
    },
  };
}

function invokeCors({ allowedOrigins, method = "POST", origin }) {
  const response = createResponse();
  let nextCalls = 0;

  createMcpCorsMiddleware(allowedOrigins)(
    {
      header(name) {
        return name.toLowerCase() === "origin" ? origin : undefined;
      },
      method,
    },
    response,
    () => {
      nextCalls += 1;
    },
  );

  return { nextCalls, response };
}

void test("allows only loopback and configured browser origins", () => {
  const allowedOrigins = ["https://preview.tambo.co"];

  assert.equal(isAllowedCorsOrigin(undefined, allowedOrigins), true);
  assert.equal(
    isAllowedCorsOrigin("http://localhost:3000", allowedOrigins),
    true,
  );
  assert.equal(
    isAllowedCorsOrigin("https://127.0.0.1:3000", allowedOrigins),
    true,
  );
  assert.equal(isAllowedCorsOrigin("http://[::1]:3000", allowedOrigins), true);
  assert.equal(
    isAllowedCorsOrigin("https://preview.tambo.co", allowedOrigins),
    true,
  );
  assert.equal(
    isAllowedCorsOrigin("https://attacker.example", allowedOrigins),
    false,
  );
  assert.equal(
    isAllowedCorsOrigin("https://localhost.attacker.example", allowedOrigins),
    false,
  );
  assert.equal(isAllowedCorsOrigin("not an origin", allowedOrigins), false);
});

void test("rejects browser requests from unconfigured origins", () => {
  const { nextCalls, response } = invokeCors({
    allowedOrigins: [],
    origin: "https://attacker.example",
  });

  assert.equal(nextCalls, 0);
  assert.equal(response.statusCode, 403);
  assert.equal(response.body, "Origin is not allowed");
});

void test("sets CORS headers for allowed browser requests", () => {
  const origin = "https://preview.tambo.co";
  const { nextCalls, response } = invokeCors({
    allowedOrigins: [origin],
    origin,
  });

  assert.equal(nextCalls, 1);
  assert.equal(response.headers.get("access-control-allow-origin"), origin);
  assert.equal(
    response.headers.get("access-control-allow-methods"),
    "GET, POST, DELETE",
  );
  assert.equal(
    response.headers.get("access-control-allow-headers"),
    "authorization, content-type, mcp-protocol-version, mcp-session-id, last-event-id",
  );
  assert.equal(
    response.headers.get("access-control-expose-headers"),
    "mcp-session-id, last-event-id, mcp-protocol-version",
  );
  assert.equal(response.headers.get("vary"), "Origin");
});

void test("ends allowed CORS preflight requests", () => {
  const { nextCalls, response } = invokeCors({
    allowedOrigins: [],
    method: "OPTIONS",
    origin: "http://localhost:3000",
  });

  assert.equal(nextCalls, 0);
  assert.equal(response.statusCode, 204);
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    "http://localhost:3000",
  );
  assert.equal(response.headers.get("vary"), "Origin");
});
