import { isTamboCloud } from "./shutdown-config";

const mockEnv = { NEXTAUTH_URL: "https://console.tambo.co" };

jest.mock("@/lib/env", () => ({
  env: {
    get NEXTAUTH_URL() {
      return mockEnv.NEXTAUTH_URL;
    },
  },
}));

describe("isTamboCloud", () => {
  afterEach(() => {
    mockEnv.NEXTAUTH_URL = "https://console.tambo.co";
  });

  it.each([
    "https://tambo.co",
    "https://console.tambo.co",
    "https://console.staging.tambo.co",
    "https://console.tambo.co:443",
  ])("identifies %s as Tambo Cloud", (url) => {
    mockEnv.NEXTAUTH_URL = url;

    expect(isTamboCloud()).toBe(true);
  });

  it.each([
    "http://localhost:8260",
    "http://127.0.0.1:8260",
    "https://tambo.example.com",
    "https://fake-tambo.co",
    "https://console.tambo.co.example.com",
    "https://example.com/tambo.co",
  ])("preserves self-hosted behavior on %s", (url) => {
    mockEnv.NEXTAUTH_URL = url;

    expect(isTamboCloud()).toBe(false);
  });

  it("fails when the authentication URL is invalid", () => {
    mockEnv.NEXTAUTH_URL = "not-a-url";

    expect(() => isTamboCloud()).toThrow("Invalid URL");
  });
});
