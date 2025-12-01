import { jest } from "@jest/globals";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import {
  OAuthValidationMode,
  encryptOAuthSecretKey,
} from "@tambo-ai-cloud/core";
import { SignJWT, exportJWK, exportSPKI, generateKeyPair } from "jose";
import { CorrelationLoggerService } from "../services/logger.service";
import { validateSubjectToken } from "./oauth";

// Mock global fetch for OpenID discovery tests
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("validateSubjectToken", () => {
  let mockLogger: jest.Mocked<CorrelationLoggerService>;
  const symmetricSecret = "my-test-secret-key-that-is-long-enough";
  const apiKeySecret = "test-api-key-secret";
  const testPayload = {
    sub: "user123",
    iss: "https://example.com",
    aud: "test-audience",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_KEY_SECRET = apiKeySecret;

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as any;
  });

  describe("NONE validation mode", () => {
    it("should decode JWT without verification", async () => {
      // Create a real JWT (even though we won't verify it)
      const token = await new SignJWT(testPayload)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      const result = await validateSubjectToken(
        token,
        OAuthValidationMode.NONE,
        null,
        mockLogger,
      );

      expect(result.sub).toBe("user123");
      expect(result.iss).toBe("https://example.com");
    });

    it("should reject expired JWT even in NONE mode (expiry is always checked)", async () => {
      // Create an expired JWT (expired 1 hour ago)
      const expiredPayload = {
        ...testPayload,
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };

      const expiredToken = await new SignJWT(expiredPayload)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      // NONE mode should now reject expired tokens for security
      await expect(
        validateSubjectToken(
          expiredToken,
          OAuthValidationMode.NONE,
          null,
          mockLogger,
        ),
      ).rejects.toThrow("Token has expired");
    });

    it("should handle tokens without expiry in NONE mode", async () => {
      // Create a token without expiry claim
      const payloadWithoutExp = {
        sub: "user123",
        iss: "https://example.com",
        aud: "test-audience",
        iat: Math.floor(Date.now() / 1000),
      };

      const tokenWithoutExp = await new SignJWT(payloadWithoutExp)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      // Should work fine without expiry claim
      const result = await validateSubjectToken(
        tokenWithoutExp,
        OAuthValidationMode.NONE,
        null,
        mockLogger,
      );

      expect(result.sub).toBe("user123");
      expect(result.iss).toBe("https://example.com");
      expect(result.exp).toBeUndefined();
    });
  });

  describe("SYMMETRIC validation mode", () => {
    it("should verify JWT with symmetric key", async () => {
      // Pre-encrypt the secret key using the real encryption function
      const encryptedSecretKey = encryptOAuthSecretKey(
        symmetricSecret,
        apiKeySecret,
      );

      const mockSettings = {
        secretKeyEncrypted: encryptedSecretKey,
        publicKey: null,
      };

      // Create a real JWT with the symmetric key
      const token = await new SignJWT(testPayload)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      const result = await validateSubjectToken(
        token,
        OAuthValidationMode.SYMMETRIC,
        mockSettings,
        mockLogger,
      );

      expect(result.sub).toBe("user123");
      expect(result.iss).toBe("https://example.com");
    });

    it("should reject expired JWT with symmetric key", async () => {
      // Pre-encrypt the secret key using the real encryption function
      const encryptedSecretKey = encryptOAuthSecretKey(
        symmetricSecret,
        apiKeySecret,
      );

      const mockSettings = {
        secretKeyEncrypted: encryptedSecretKey,
        publicKey: null,
      };

      // Create an expired JWT (expired 1 hour ago)
      const expiredPayload = {
        ...testPayload,
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };

      const expiredToken = await new SignJWT(expiredPayload)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      await expect(
        validateSubjectToken(
          expiredToken,
          OAuthValidationMode.SYMMETRIC,
          mockSettings,
          mockLogger,
        ),
      ).rejects.toThrow();
    });

    it("should reject JWT with wrong symmetric key", async () => {
      // Pre-encrypt a different secret key
      const wrongSecret = "wrong-secret-key";
      const encryptedWrongSecret = encryptOAuthSecretKey(
        wrongSecret,
        apiKeySecret,
      );

      const mockSettings = {
        secretKeyEncrypted: encryptedWrongSecret,
        publicKey: null,
      };

      // Create a JWT with the correct key
      const token = await new SignJWT(testPayload)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      await expect(
        validateSubjectToken(
          token,
          OAuthValidationMode.SYMMETRIC,
          mockSettings,
          mockLogger,
        ),
      ).rejects.toThrow();
    });

    it("should throw error when secret key is missing", async () => {
      await expect(
        validateSubjectToken(
          "any-token",
          OAuthValidationMode.SYMMETRIC,
          { secretKeyEncrypted: null, publicKey: null },
          mockLogger,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw error when oauth settings are null", async () => {
      await expect(
        validateSubjectToken(
          "any-token",
          OAuthValidationMode.SYMMETRIC,
          null,
          mockLogger,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw error when secret key is invalid encrypted format", async () => {
      const mockSettings = {
        secretKeyEncrypted: "invalid-encrypted-format",
        publicKey: null,
      };

      const token = await new SignJWT(testPayload)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      await expect(
        validateSubjectToken(
          token,
          OAuthValidationMode.SYMMETRIC,
          mockSettings,
          mockLogger,
        ),
      ).rejects.toThrow();
    });
  });

  describe("ASYMMETRIC_MANUAL validation mode", () => {
    it("should verify JWT with manual public key", async () => {
      // Generate a real RSA key pair
      const { publicKey, privateKey } = await generateKeyPair("RS256");
      const publicJWK = await exportJWK(publicKey);

      const mockSettings = {
        secretKeyEncrypted: null,
        publicKey: JSON.stringify(publicJWK),
      };

      // Create a real JWT with the private key
      const token = await new SignJWT(testPayload)
        .setProtectedHeader({ alg: "RS256" })
        .sign(privateKey);

      const result = await validateSubjectToken(
        token,
        OAuthValidationMode.ASYMMETRIC_MANUAL,
        mockSettings,
        mockLogger,
      );

      expect(result.sub).toBe("user123");
      expect(result.iss).toBe("https://example.com");
    });

    it("should reject expired JWT with manual public key", async () => {
      // Generate a real RSA key pair
      const { publicKey, privateKey } = await generateKeyPair("RS256");
      const publicJWK = await exportJWK(publicKey);

      const mockSettings = {
        secretKeyEncrypted: null,
        publicKey: JSON.stringify(publicJWK),
      };

      // Create an expired JWT (expired 1 hour ago)
      const expiredPayload = {
        ...testPayload,
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };

      const expiredToken = await new SignJWT(expiredPayload)
        .setProtectedHeader({ alg: "RS256" })
        .sign(privateKey);

      await expect(
        validateSubjectToken(
          expiredToken,
          OAuthValidationMode.ASYMMETRIC_MANUAL,
          mockSettings,
          mockLogger,
        ),
      ).rejects.toThrow();
    });

    it("should reject JWT with wrong public key", async () => {
      // Generate two different key pairs
      const { privateKey: privateKey1 } = await generateKeyPair("RS256");
      const { publicKey: publicKey2 } = await generateKeyPair("RS256");
      const wrongPublicJWK = await exportJWK(publicKey2);

      const mockSettings = {
        secretKeyEncrypted: null,
        publicKey: JSON.stringify(wrongPublicJWK),
      };

      // Create JWT with first private key, try to verify with second public key
      const token = await new SignJWT(testPayload)
        .setProtectedHeader({ alg: "RS256" })
        .sign(privateKey1);

      await expect(
        validateSubjectToken(
          token,
          OAuthValidationMode.ASYMMETRIC_MANUAL,
          mockSettings,
          mockLogger,
        ),
      ).rejects.toThrow();
    });

    it("should throw error when public key is missing", async () => {
      await expect(
        validateSubjectToken(
          "any-token",
          OAuthValidationMode.ASYMMETRIC_MANUAL,
          { secretKeyEncrypted: null, publicKey: null },
          mockLogger,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw error when public key is invalid JSON", async () => {
      const invalidSettings = {
        secretKeyEncrypted: null,
        publicKey: "invalid-json",
      };

      await expect(
        validateSubjectToken(
          "any-token",
          OAuthValidationMode.ASYMMETRIC_MANUAL,
          invalidSettings,
          mockLogger,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Error parsing or using manual public key"),
      );
    });

    it("should verify JWT with manual PEM public key", async () => {
      // Generate a real RSA key pair
      const { publicKey, privateKey } = await generateKeyPair("RS256");
      const publicPEM = await exportSPKI(publicKey);

      const mockSettings = {
        secretKeyEncrypted: null,
        publicKey: publicPEM,
      };

      // Create a real JWT with the private key
      const token = await new SignJWT(testPayload)
        .setProtectedHeader({ alg: "RS256" })
        .sign(privateKey);

      const result = await validateSubjectToken(
        token,
        OAuthValidationMode.ASYMMETRIC_MANUAL,
        mockSettings,
        mockLogger,
      );

      expect(result.sub).toBe("user123");
      expect(result.iss).toBe("https://example.com");
    });
  });

  describe("ASYMMETRIC_AUTO validation mode", () => {
    // TODO: Fix mocking of createRemoteJWKSet to avoid network requests
    // This test currently tries to make real network requests
    // it("should verify JWT using OpenID discovery", async () => {
    //   // Generate a real key pair for the test issuer
    //   const { publicKey, privateKey } = await generateKeyPair("RS256");
    //   const publicJWK = await exportJWK(publicKey);
    //
    //   const issuer = "https://auth.example.com";
    //   const payloadWithIssuer = { ...testPayload, iss: issuer };
    //
    //   // Create a real JWT
    //   const token = await new SignJWT(payloadWithIssuer)
    //     .setProtectedHeader({ alg: "RS256", kid: "test-key-id" })
    //     .sign(privateKey);
    //
    //   // Mock the OpenID configuration endpoint
    //   const mockOpenIdConfig = {
    //     issuer,
    //     jwks_uri: `${issuer}/.well-known/jwks.json`,
    //   };
    //
    //   // Mock createRemoteJWKSet to return a local key set
    //   const mockKeySet = {
    //     async [Symbol.asyncIterator]() {
    //       return {
    //         async next() {
    //           return { value: await importJWK(publicJWK), done: false };
    //         },
    //       };
    //     },
    //   };
    //
    //   // Mock the jose module's createRemoteJWKSet function
    //   jest.doMock("jose", () => {
    //     const actual = jest.requireActual("jose");
    //     return {
    //       ...actual,
    //       createRemoteJWKSet: jest.fn().mockReturnValue(mockKeySet),
    //     };
    //   });
    //
    //   (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
    //     ok: true,
    //     json: (jest.fn() as any).mockResolvedValue(mockOpenIdConfig),
    //   } as any);
    //
    //   const result = await validateSubjectToken(
    //     token,
    //     OAuthValidationMode.ASYMMETRIC_AUTO,
    //     null,
    //     mockLogger,
    //   );
    //
    //   expect(result.sub).toBe("user123");
    //   expect(result.iss).toBe(issuer);
    //   expect(global.fetch).toHaveBeenCalledWith(
    //     `${issuer}/.well-known/openid-configuration`,
    //   );
    //   expect(mockLogger.log).toHaveBeenCalledWith(
    //     `Fetching OpenID configuration from: ${issuer}/.well-known/openid-configuration`,
    //   );
    // });

    it("should throw error when token has no issuer", async () => {
      // Create a token without issuer
      const payloadWithoutIssuer: any = { ...testPayload };
      delete payloadWithoutIssuer.iss;

      const token = await new SignJWT(payloadWithoutIssuer)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      await expect(
        validateSubjectToken(
          token,
          OAuthValidationMode.ASYMMETRIC_AUTO,
          null,
          mockLogger,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw error when OpenID config fetch fails", async () => {
      const token = await new SignJWT(testPayload)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        statusText: "Not Found",
      } as any);

      await expect(
        validateSubjectToken(
          token,
          OAuthValidationMode.ASYMMETRIC_AUTO,
          null,
          mockLogger,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to fetch OpenID configuration: Not Found",
      );
    });

    it("should throw error when OpenID config is missing jwks_uri", async () => {
      const token = await new SignJWT(testPayload)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: (jest.fn() as any).mockResolvedValue({
          issuer: "https://auth.example.com",
        }),
      } as any);

      await expect(
        validateSubjectToken(
          token,
          OAuthValidationMode.ASYMMETRIC_AUTO,
          null,
          mockLogger,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("Unsupported validation mode", () => {
    it("should throw error for unsupported validation mode", async () => {
      await expect(
        validateSubjectToken(
          "any-token",
          "INVALID_MODE" as OAuthValidationMode,
          null,
          mockLogger,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("Edge cases", () => {
    it("should handle null oauth settings for NONE mode", async () => {
      const token = await new SignJWT(testPayload)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      const result = await validateSubjectToken(
        token,
        OAuthValidationMode.NONE,
        null,
        mockLogger,
      );

      expect(result.sub).toBe("user123");
    });

    it("should handle invalid JWT format", async () => {
      await expect(
        validateSubjectToken(
          "not-a-jwt",
          OAuthValidationMode.NONE,
          null,
          mockLogger,
        ),
      ).rejects.toThrow();
    });
  });

  describe("Security validations", () => {
    describe("Input validation", () => {
      it("should reject null/empty subject tokens", async () => {
        await expect(
          validateSubjectToken("", OAuthValidationMode.NONE, null, mockLogger),
        ).rejects.toThrow(BadRequestException);

        await expect(
          validateSubjectToken(
            null as any,
            OAuthValidationMode.NONE,
            null,
            mockLogger,
          ),
        ).rejects.toThrow(BadRequestException);
      });

      it("should reject oversized tokens", async () => {
        const largeToken = "a".repeat(9000); // > 8KB limit

        await expect(
          validateSubjectToken(
            largeToken,
            OAuthValidationMode.NONE,
            null,
            mockLogger,
          ),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe("SSRF protection", () => {
      it("should reject localhost issuer", async () => {
        const maliciousPayload = {
          ...testPayload,
          iss: "http://localhost:8080",
        };

        const token = await new SignJWT(maliciousPayload)
          .setProtectedHeader({ alg: "HS256" })
          .sign(new TextEncoder().encode(symmetricSecret));

        await expect(
          validateSubjectToken(
            token,
            OAuthValidationMode.ASYMMETRIC_AUTO,
            null,
            mockLogger,
          ),
        ).rejects.toThrow(UnauthorizedException);
      });

      it("should reject private network issuer", async () => {
        const maliciousPayload = {
          ...testPayload,
          iss: "https://192.168.1.1",
        };

        const token = await new SignJWT(maliciousPayload)
          .setProtectedHeader({ alg: "HS256" })
          .sign(new TextEncoder().encode(symmetricSecret));

        await expect(
          validateSubjectToken(
            token,
            OAuthValidationMode.ASYMMETRIC_AUTO,
            null,
            mockLogger,
          ),
        ).rejects.toThrow(UnauthorizedException);
      });

      it("should reject metadata service issuer", async () => {
        const maliciousPayload = {
          ...testPayload,
          iss: "https://169.254.169.254",
        };

        const token = await new SignJWT(maliciousPayload)
          .setProtectedHeader({ alg: "HS256" })
          .sign(new TextEncoder().encode(symmetricSecret));

        await expect(
          validateSubjectToken(
            token,
            OAuthValidationMode.ASYMMETRIC_AUTO,
            null,
            mockLogger,
          ),
        ).rejects.toThrow(UnauthorizedException);
      });

      it("should reject non-HTTPS issuer", async () => {
        const maliciousPayload = {
          ...testPayload,
          iss: "http://example.com",
        };

        const token = await new SignJWT(maliciousPayload)
          .setProtectedHeader({ alg: "HS256" })
          .sign(new TextEncoder().encode(symmetricSecret));

        await expect(
          validateSubjectToken(
            token,
            OAuthValidationMode.ASYMMETRIC_AUTO,
            null,
            mockLogger,
          ),
        ).rejects.toThrow(UnauthorizedException);
      });

      it("should reject issuer with path components", async () => {
        const maliciousPayload = {
          ...testPayload,
          iss: "https://example.com/malicious/path",
        };

        const token = await new SignJWT(maliciousPayload)
          .setProtectedHeader({ alg: "HS256" })
          .sign(new TextEncoder().encode(symmetricSecret));

        await expect(
          validateSubjectToken(
            token,
            OAuthValidationMode.ASYMMETRIC_AUTO,
            null,
            mockLogger,
          ),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe("Key type validation", () => {
      it("should reject private key in manual public key field", async () => {
        // Generate an RSA key pair and export the private key
        const { privateKey } = await generateKeyPair("RS256");
        const privateJWK = await exportJWK(privateKey);

        const mockSettings = {
          secretKeyEncrypted: null,
          publicKey: JSON.stringify(privateJWK),
        };

        const token = await new SignJWT(testPayload)
          .setProtectedHeader({ alg: "RS256" })
          .sign(privateKey);

        await expect(
          validateSubjectToken(
            token,
            OAuthValidationMode.ASYMMETRIC_MANUAL,
            mockSettings,
            mockLogger,
          ),
        ).rejects.toThrow(UnauthorizedException);
      });

      it("should reject oversized public key configuration", async () => {
        const largeKeyConfig = "a".repeat(15000); // > 10KB limit

        const mockSettings = {
          secretKeyEncrypted: null,
          publicKey: largeKeyConfig,
        };

        await expect(
          validateSubjectToken(
            "any-token",
            OAuthValidationMode.ASYMMETRIC_MANUAL,
            mockSettings,
            mockLogger,
          ),
        ).rejects.toThrow(UnauthorizedException);
      });
    });

    describe("Symmetric key validation", () => {
      it("should reject short symmetric keys", async () => {
        const shortSecret = "short"; // < 32 characters
        const encryptedShortSecret = encryptOAuthSecretKey(
          shortSecret,
          apiKeySecret,
        );

        const mockSettings = {
          secretKeyEncrypted: encryptedShortSecret,
          publicKey: null,
        };

        const token = await new SignJWT(testPayload)
          .setProtectedHeader({ alg: "HS256" })
          .sign(new TextEncoder().encode(shortSecret));

        await expect(
          validateSubjectToken(
            token,
            OAuthValidationMode.SYMMETRIC,
            mockSettings,
            mockLogger,
          ),
        ).rejects.toThrow(UnauthorizedException);
      });
    });

    describe("Environment validation", () => {
      it("should throw error when API_KEY_SECRET is not set", async () => {
        const originalSecret = process.env.API_KEY_SECRET;
        delete process.env.API_KEY_SECRET;

        try {
          await expect(
            validateSubjectToken(
              "any-token",
              OAuthValidationMode.SYMMETRIC,
              { secretKeyEncrypted: "encrypted", publicKey: null },
              mockLogger,
            ),
          ).rejects.toThrow(UnauthorizedException);

          expect(mockLogger.error).toHaveBeenCalledWith(
            "API_KEY_SECRET environment variable not set",
          );
        } finally {
          process.env.API_KEY_SECRET = originalSecret;
        }
      });
    });
  });

  describe("Token expiry timing", () => {
    it("should validate tokens that expire soon but are still valid", async () => {
      // Create a token that expires in 30 seconds (still valid)
      const expectedExp = Math.floor(Date.now() / 1000) + 30; // expires in 30 seconds

      const soonToExpirePayload = {
        ...testPayload,
        exp: expectedExp,
      };

      const soonToExpireToken = await new SignJWT(soonToExpirePayload)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      // Should work fine - token is not yet expired
      const result = await validateSubjectToken(
        soonToExpireToken,
        OAuthValidationMode.NONE,
        null,
        mockLogger,
      );

      expect(result.sub).toBe("user123");
      expect(result.iss).toBe("https://example.com");
      expect(result.exp).toBe(expectedExp);
    });

    it("should reject tokens that just expired", async () => {
      // Create a token that expired 1 second ago
      const justExpiredPayload = {
        ...testPayload,
        exp: Math.floor(Date.now() / 1000) - 1, // expired 1 second ago
      };

      const justExpiredToken = await new SignJWT(justExpiredPayload)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      // Should be rejected as expired
      await expect(
        validateSubjectToken(
          justExpiredToken,
          OAuthValidationMode.NONE,
          null,
          mockLogger,
        ),
      ).rejects.toThrow("Token has expired");
    });
  });
});
