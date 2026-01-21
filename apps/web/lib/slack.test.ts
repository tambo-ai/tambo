import { env } from "./env";
import { callSlackAPI } from "./slack";

jest.mock("./env", () => ({
  env: {
    SLACK_OAUTH_TOKEN: "initial-dummy-token",
  },
}));

describe("callSlackAPI - Environment Variables", () => {
  const endpoint = "chat.postMessage";
  const body = { channel: "C123", text: "Hello" };

  test("should throw an error if SLACK_OAUTH_TOKEN is empty", async () => {
    (env as any).SLACK_OAUTH_TOKEN = "";
    await expect(callSlackAPI(endpoint, body)).rejects.toThrow(
      "SLACK_OAUTH_TOKEN environment variable is not set",
    );
  });

  test("should throw an error if SLACK_OAUTH_TOKEN is missing (undefined)", async () => {
    (env as any).SLACK_OAUTH_TOKEN = undefined;
    await expect(callSlackAPI(endpoint, body)).rejects.toThrow(
      "SLACK_OAUTH_TOKEN environment variable is not set",
    );
  });
});
