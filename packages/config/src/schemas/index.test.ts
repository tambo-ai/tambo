import { fullConfigSchema, dbConfigSchema, cliConfigSchema } from "./index";

describe("fullConfigSchema", () => {
  it("accepts empty config (all optional)", () => {
    const result = fullConfigSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it("validates database config", () => {
    const result = fullConfigSchema.safeParse({
      database: {
        url: "postgresql://localhost/test",
        poolSize: 5,
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.database?.url).toBe("postgresql://localhost/test");
      expect(result.data.database?.poolSize).toBe(5);
    }
  });

  it("applies database poolSize default", () => {
    const result = fullConfigSchema.safeParse({
      database: {
        url: "postgresql://localhost/test",
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.database?.poolSize).toBe(10);
    }
  });

  it("validates auth config", () => {
    const result = fullConfigSchema.safeParse({
      auth: {
        secret: "supersecret123",
        url: "http://localhost:3000",
        github: {
          clientId: "abc123",
          clientSecret: "secret",
        },
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.auth?.github?.clientId).toBe("abc123");
    }
  });

  it("rejects invalid auth secret (too short)", () => {
    const result = fullConfigSchema.safeParse({
      auth: {
        secret: "short",
        url: "http://localhost:3000",
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid auth url", () => {
    const result = fullConfigSchema.safeParse({
      auth: {
        secret: "supersecret123",
        url: "not-a-url",
      },
    });

    expect(result.success).toBe(false);
  });

  it("validates cli config with defaults", () => {
    const result = fullConfigSchema.safeParse({
      cli: {},
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cli?.apiUrl).toBe("https://api.tambo.co");
      expect(result.data.cli?.components?.prefix).toBe("src/components/tambo");
    }
  });

  it("validates integrations config", () => {
    const result = fullConfigSchema.safeParse({
      integrations: {
        slack: {
          oauthToken: "xoxb-token",
        },
        resend: {
          apiKey: "re_key",
        },
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.integrations?.slack?.oauthToken).toBe("xoxb-token");
    }
  });

  it("validates paths override", () => {
    const result = fullConfigSchema.safeParse({
      paths: {
        config: "/custom/config",
        data: "/custom/data",
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.paths?.config).toBe("/custom/config");
    }
  });
});

describe("dbConfigSchema", () => {
  it("requires database url", () => {
    const result = dbConfigSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("accepts valid database config", () => {
    const result = dbConfigSchema.safeParse({
      database: {
        url: "postgresql://localhost/test",
      },
    });

    expect(result.success).toBe(true);
  });
});

describe("cliConfigSchema", () => {
  it("applies defaults for empty config", () => {
    const result = cliConfigSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cli.apiUrl).toBe("https://api.tambo.co");
      expect(result.data.cli.components.prefix).toBe("src/components/tambo");
      expect(result.data.cli.output.color).toBe(true);
    }
  });

  it("allows overriding cli defaults", () => {
    const result = cliConfigSchema.safeParse({
      cli: {
        apiUrl: "http://localhost:3001",
        components: {
          prefix: "src/ui",
        },
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cli.apiUrl).toBe("http://localhost:3001");
      expect(result.data.cli.components.prefix).toBe("src/ui");
    }
  });
});
