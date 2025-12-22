import {
  ENV_VAR_MAPPING,
  CONFIG_PATH_MAPPING,
  envVarToConfigPath,
  configPathToEnvVar,
  getAllMappedEnvVars,
} from "./env-mapping";

describe("ENV_VAR_MAPPING", () => {
  it("maps database.url to DATABASE_URL", () => {
    expect(ENV_VAR_MAPPING["database.url"]).toBe("DATABASE_URL");
  });

  it("maps auth.secret to NEXTAUTH_SECRET", () => {
    expect(ENV_VAR_MAPPING["auth.secret"]).toBe("NEXTAUTH_SECRET");
  });

  it("maps nested paths correctly", () => {
    expect(ENV_VAR_MAPPING["auth.github.clientId"]).toBe("GITHUB_CLIENT_ID");
    expect(ENV_VAR_MAPPING["integrations.slack.oauthToken"]).toBe(
      "SLACK_OAUTH_TOKEN",
    );
  });

  it("maps path overrides", () => {
    expect(ENV_VAR_MAPPING["paths.config"]).toBe("TAMBO_CONFIG_DIR");
    expect(ENV_VAR_MAPPING["paths.data"]).toBe("TAMBO_DATA_DIR");
  });
});

describe("CONFIG_PATH_MAPPING", () => {
  it("is the reverse of ENV_VAR_MAPPING", () => {
    expect(CONFIG_PATH_MAPPING["DATABASE_URL"]).toBe("database.url");
    expect(CONFIG_PATH_MAPPING["NEXTAUTH_SECRET"]).toBe("auth.secret");
  });
});

describe("envVarToConfigPath", () => {
  it("returns config path for known env var", () => {
    expect(envVarToConfigPath("DATABASE_URL")).toBe("database.url");
  });

  it("returns undefined for unknown env var", () => {
    expect(envVarToConfigPath("UNKNOWN_VAR")).toBeUndefined();
  });
});

describe("configPathToEnvVar", () => {
  it("returns env var for known config path", () => {
    expect(configPathToEnvVar("database.url")).toBe("DATABASE_URL");
  });

  it("returns undefined for unknown config path", () => {
    expect(configPathToEnvVar("unknown.path")).toBeUndefined();
  });
});

describe("getAllMappedEnvVars", () => {
  it("returns all mapped env var names", () => {
    const vars = getAllMappedEnvVars();

    expect(vars).toContain("DATABASE_URL");
    expect(vars).toContain("NEXTAUTH_SECRET");
    expect(vars).toContain("TAMBO_CONFIG_DIR");
    expect(Array.isArray(vars)).toBe(true);
  });
});
