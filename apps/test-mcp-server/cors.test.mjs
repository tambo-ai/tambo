import assert from "node:assert/strict";
import test from "node:test";

import { isAllowedCorsOrigin } from "./src/cors.js";

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
