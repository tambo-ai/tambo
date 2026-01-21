import {
  signAttachmentPath,
  buildStorageKey,
  buildAttachmentUri,
  parseAttachmentUri,
  ATTACHMENT_ID_LENGTH,
} from "./attachment";

describe("attachment utilities", () => {
  const TEST_SECRET = "test-secret-key";
  const TEST_PROJECT_ID = "p_abc123";
  const TEST_UNIQUE_ID = "Ab3xY9kLmN";

  describe("ATTACHMENT_ID_LENGTH", () => {
    it("exports the expected ID length", () => {
      expect(ATTACHMENT_ID_LENGTH).toBe(10);
    });
  });

  describe("signAttachmentPath", () => {
    it("generates a consistent signature for the same input", () => {
      const path = `${TEST_PROJECT_ID}/${TEST_UNIQUE_ID}`;
      const sig1 = signAttachmentPath(path, TEST_SECRET);
      const sig2 = signAttachmentPath(path, TEST_SECRET);
      expect(sig1).toBe(sig2);
    });

    it("generates different signatures for different paths", () => {
      const sig1 = signAttachmentPath("project1/id1", TEST_SECRET);
      const sig2 = signAttachmentPath("project2/id2", TEST_SECRET);
      expect(sig1).not.toBe(sig2);
    });

    it("generates different signatures for different secrets", () => {
      const path = `${TEST_PROJECT_ID}/${TEST_UNIQUE_ID}`;
      const sig1 = signAttachmentPath(path, "secret1");
      const sig2 = signAttachmentPath(path, "secret2");
      expect(sig1).not.toBe(sig2);
    });

    it("returns an 8-character hex string", () => {
      const sig = signAttachmentPath("test/path", TEST_SECRET);
      expect(sig).toMatch(/^[a-f0-9]{8}$/);
    });
  });

  describe("buildStorageKey", () => {
    it("builds key in format {projectId}/{uniqueId}-{signature}", () => {
      const key = buildStorageKey(TEST_PROJECT_ID, TEST_UNIQUE_ID, TEST_SECRET);
      expect(key).toMatch(
        new RegExp(`^${TEST_PROJECT_ID}/${TEST_UNIQUE_ID}-[a-f0-9]{8}$`),
      );
    });

    it("produces consistent keys for the same inputs", () => {
      const key1 = buildStorageKey(
        TEST_PROJECT_ID,
        TEST_UNIQUE_ID,
        TEST_SECRET,
      );
      const key2 = buildStorageKey(
        TEST_PROJECT_ID,
        TEST_UNIQUE_ID,
        TEST_SECRET,
      );
      expect(key1).toBe(key2);
    });

    it("produces different keys for different unique IDs", () => {
      const key1 = buildStorageKey(TEST_PROJECT_ID, "uniqueId1", TEST_SECRET);
      const key2 = buildStorageKey(TEST_PROJECT_ID, "uniqueId2", TEST_SECRET);
      expect(key1).not.toBe(key2);
    });
  });

  describe("buildAttachmentUri", () => {
    it("builds URI in format attachment://{projectId}/{uniqueId}", () => {
      const uri = buildAttachmentUri(TEST_PROJECT_ID, TEST_UNIQUE_ID);
      expect(uri).toBe(`attachment://${TEST_PROJECT_ID}/${TEST_UNIQUE_ID}`);
    });

    it("does not include signature in URI", () => {
      const uri = buildAttachmentUri(TEST_PROJECT_ID, TEST_UNIQUE_ID);
      expect(uri).not.toMatch(/-[a-f0-9]{8}$/);
    });
  });

  describe("parseAttachmentUri", () => {
    it("parses valid URI and reconstructs storage key", () => {
      const uri = `attachment://${TEST_PROJECT_ID}/${TEST_UNIQUE_ID}`;
      const result = parseAttachmentUri(uri, TEST_SECRET);

      expect(result.projectId).toBe(TEST_PROJECT_ID);
      expect(result.uniqueId).toBe(TEST_UNIQUE_ID);
      expect(result.storageKey).toBe(
        buildStorageKey(TEST_PROJECT_ID, TEST_UNIQUE_ID, TEST_SECRET),
      );
    });

    it("throws for URI without attachment:// prefix", () => {
      expect(() => parseAttachmentUri("file://some/path", TEST_SECRET)).toThrow(
        'Must start with "attachment://"',
      );
    });

    it("throws for empty path", () => {
      expect(() => parseAttachmentUri("attachment://", TEST_SECRET)).toThrow(
        "Missing path",
      );
    });

    it("throws for whitespace-only path", () => {
      expect(() => parseAttachmentUri("attachment://   ", TEST_SECRET)).toThrow(
        "Missing path",
      );
    });

    it("throws for path with backslash", () => {
      expect(() =>
        parseAttachmentUri(
          `attachment://${TEST_PROJECT_ID}\\${TEST_UNIQUE_ID}`,
          TEST_SECRET,
        ),
      ).toThrow("Contains invalid characters");
    });

    it("throws for path with double slashes", () => {
      expect(() =>
        parseAttachmentUri(
          `attachment://${TEST_PROJECT_ID}//${TEST_UNIQUE_ID}`,
          TEST_SECRET,
        ),
      ).toThrow("Contains invalid characters");
    });

    it("throws for path without slash separator", () => {
      expect(() =>
        parseAttachmentUri("attachment://noslash", TEST_SECRET),
      ).toThrow("Expected format");
    });

    it("throws for path with only projectId", () => {
      expect(() =>
        parseAttachmentUri(`attachment://${TEST_PROJECT_ID}/`, TEST_SECRET),
      ).toThrow("Expected format");
    });

    it("throws for path with only uniqueId", () => {
      expect(() =>
        parseAttachmentUri(`attachment:///${TEST_UNIQUE_ID}`, TEST_SECRET),
      ).toThrow("Expected format");
    });

    it("round-trips with buildAttachmentUri", () => {
      const originalUri = buildAttachmentUri(TEST_PROJECT_ID, TEST_UNIQUE_ID);
      const parsed = parseAttachmentUri(originalUri, TEST_SECRET);

      expect(parsed.projectId).toBe(TEST_PROJECT_ID);
      expect(parsed.uniqueId).toBe(TEST_UNIQUE_ID);
    });

    it("produces storage key that matches buildStorageKey", () => {
      const uri = `attachment://${TEST_PROJECT_ID}/${TEST_UNIQUE_ID}`;
      const parsed = parseAttachmentUri(uri, TEST_SECRET);
      const expectedKey = buildStorageKey(
        TEST_PROJECT_ID,
        TEST_UNIQUE_ID,
        TEST_SECRET,
      );

      expect(parsed.storageKey).toBe(expectedKey);
    });
  });
});
