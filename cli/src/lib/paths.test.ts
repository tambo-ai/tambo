import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

jest.unstable_mockModule("env-paths", () => ({
  default: () => ({
    cache: "/mock/cache/tambo",
    config: "/mock/config/tambo",
    data: "/mock/data/tambo",
  }),
}));

let getDir: (type: "cache" | "config" | "data") => string;

beforeAll(async () => {
  const module = await import("./paths.js");
  getDir = module.getDir;
});

describe("getDir", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    delete process.env.XDG_CACHE_HOME;
    delete process.env.XDG_CONFIG_HOME;
    delete process.env.XDG_DATA_HOME;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns env-paths default for data when no XDG var is set", () => {
    expect(getDir("data")).toBe("/mock/data/tambo");
  });

  it("returns env-paths default for cache when no XDG var is set", () => {
    expect(getDir("cache")).toBe("/mock/cache/tambo");
  });

  it("returns env-paths default for config when no XDG var is set", () => {
    expect(getDir("config")).toBe("/mock/config/tambo");
  });

  it("uses XDG_DATA_HOME when set", () => {
    process.env.XDG_DATA_HOME = "/custom/data";
    expect(getDir("data")).toBe("/custom/data/tambo");
  });

  it("uses XDG_CACHE_HOME when set", () => {
    process.env.XDG_CACHE_HOME = "/custom/cache";
    expect(getDir("cache")).toBe("/custom/cache/tambo");
  });

  it("uses XDG_CONFIG_HOME when set", () => {
    process.env.XDG_CONFIG_HOME = "/custom/config";
    expect(getDir("config")).toBe("/custom/config/tambo");
  });
});
