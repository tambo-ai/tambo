import { keyifyParameters } from "./keyify-parameters";

describe("keyifyParameters", () => {
  it("returns undefined for undefined parameters", () => {
    expect(keyifyParameters(undefined)).toBeUndefined();
  });

  it("converts empty array to empty object", () => {
    expect(keyifyParameters([])).toEqual({});
  });

  it("converts parameters array to object", () => {
    const parameters = [
      { parameterName: "query", parameterValue: "hello" },
      { parameterName: "limit", parameterValue: 10 },
    ];
    expect(keyifyParameters(parameters)).toEqual({
      query: "hello",
      limit: 10,
    });
  });

  it("handles complex parameter values", () => {
    const parameters = [
      { parameterName: "config", parameterValue: { nested: true } },
      { parameterName: "items", parameterValue: [1, 2, 3] },
    ];
    expect(keyifyParameters(parameters)).toEqual({
      config: { nested: true },
      items: [1, 2, 3],
    });
  });
});
