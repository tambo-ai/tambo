import { extractErrorMessage } from "./extract-error-message";

describe("extractErrorMessage", () => {
  it("extracts message from a JSON zod error array", () => {
    const zodError = JSON.stringify([
      {
        validation: "regex",
        code: "invalid_string",
        message: "Name must be kebab-case (e.g. scheduling-assistant)",
        path: ["name"],
      },
    ]);
    expect(extractErrorMessage({ message: zodError })).toBe(
      "Name must be kebab-case (e.g. scheduling-assistant)",
    );
  });

  it("returns the raw message when it is not JSON", () => {
    expect(extractErrorMessage({ message: "Something went wrong" })).toBe(
      "Something went wrong",
    );
  });

  it("returns the raw message when JSON is not an array", () => {
    expect(
      extractErrorMessage({ message: JSON.stringify({ error: "oops" }) }),
    ).toBe(JSON.stringify({ error: "oops" }));
  });

  it("returns the raw message when the array has no message field", () => {
    expect(
      extractErrorMessage({ message: JSON.stringify([{ code: "custom" }]) }),
    ).toBe(JSON.stringify([{ code: "custom" }]));
  });
});
