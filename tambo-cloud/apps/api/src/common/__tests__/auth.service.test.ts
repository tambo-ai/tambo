import { AuthService } from "../services/auth.service";
import type { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";
import { generateKeyPairSync } from "crypto";

// Capture the options passed to jsonwebtoken.verify without altering behavior
let lastVerifyArgs: unknown[] | null = null;
jest.mock("jsonwebtoken", () => {
  const real = jest.requireActual("jsonwebtoken");
  return {
    ...real,
    verify: (...args: unknown[]) => {
      lastVerifyArgs = args;
      const verify = real.verify as (...a: unknown[]) => unknown;
      return verify(...args);
    },
  };
});

// Helper to create a base64url-encoded JSON segment
function b64url(obj: any): string {
  const json = typeof obj === "string" ? obj : JSON.stringify(obj);
  return Buffer.from(json)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

describe("AuthService.verifyMcpAccessToken - algorithm pinning", () => {
  const secret = "test-secret";
  let service: AuthService;

  beforeEach(() => {
    const mockConfig: Partial<ConfigService> = {
      get: (key: string) =>
        key === "API_KEY_SECRET" ? (secret as unknown as any) : undefined,
    };
    service = new AuthService(mockConfig as ConfigService, {} as any);
  });

  it("accepts a valid HS256 token", async () => {
    const payload = {
      sub: "proj1:ctx",
      exp: Math.floor(Date.now() / 1000) + 60,
      projectId: "proj1",
      threadId: "thread1",
      contextKey: "ctx",
    } as const;
    const token = jwt.sign(payload, secret, { algorithm: "HS256" });

    const decoded = service.verifyMcpAccessToken(token);
    expect(decoded.projectId).toBe("proj1");
    // Ensure we pin the algorithms list on verification
    expect(lastVerifyArgs).not.toBeNull();
    expect(lastVerifyArgs?.[2]).toMatchObject({ algorithms: ["HS256"] });
  });

  it("rejects a token signed with RS256", () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const payload = {
      sub: "proj1:ctx",
      exp: Math.floor(Date.now() / 1000) + 60,
      projectId: "proj1",
      threadId: "thread1",
      contextKey: "ctx",
    } as const;

    const rsToken = jwt.sign(payload, privateKey, { algorithm: "RS256" });
    expect(() => service.verifyMcpAccessToken(rsToken)).toThrow();
  });

  it("rejects a token with alg=none", () => {
    const header = { alg: "none", typ: "JWT" };
    const payload = {
      sub: "proj1:ctx",
      exp: Math.floor(Date.now() / 1000) + 60,
      projectId: "proj1",
      threadId: "thread1",
      contextKey: "ctx",
    };
    const noneToken = `${b64url(header)}.${b64url(payload)}.`; // empty signature
    expect(() => service.verifyMcpAccessToken(noneToken)).toThrow();
  });

  it("rejects a token signed with HS384 (not whitelisted)", () => {
    const payload = {
      sub: "proj1:ctx",
      exp: Math.floor(Date.now() / 1000) + 60,
      projectId: "proj1",
      threadId: "thread1",
      contextKey: "ctx",
    } as const;
    const tokenHS384 = jwt.sign(payload, secret, { algorithm: "HS384" });
    expect(() => service.verifyMcpAccessToken(tokenHS384)).toThrow();
  });
});
