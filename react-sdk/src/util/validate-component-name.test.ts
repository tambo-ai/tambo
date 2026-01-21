import { assertValidName } from "./validate-component-name";
describe("assertValidName", () => {
  // Valid names
  it("should not throw an error for a valid name with letters only", () => {
    expect(() => assertValidName("MyComponent", "component")).not.toThrow();
  });
  it("should not throw an error for letters, numbers, underscore", () => {
    expect(() => assertValidName("component_123", "component")).not.toThrow();
  });
  it("should not throw an error for letters, numbers, hyphen", () => {
    expect(() => assertValidName("tool-456", "tool")).not.toThrow();
  });
  it("should not throw an error for mix of letters, numbers, underscores, hyphens", () => {
    expect(() => assertValidName("A1_b-2C", "component")).not.toThrow();
  });
  it("should not throw an error with single underscore, and hyphen", () => {
    expect(() => assertValidName("_", "tool")).not.toThrow();
    expect(() => assertValidName("-", "tool")).not.toThrow();
  });
  // Invalid names
  it("should throw an error for name with space", () => {
    expect(() => assertValidName("My Component", "component")).toThrow(
      `component "My Component" must only contain letters, numbers, underscores, and hyphens.`,
    );
  });
  it("should throw an error for name with special characters", () => {
    expect(() => assertValidName("tool@123", "tool")).toThrow(
      `tool "tool@123" must only contain letters, numbers, underscores, and hyphens.`,
    );
    expect(() => assertValidName("component!$", "component")).toThrow(
      `component "component!$" must only contain letters, numbers, underscores, and hyphens.`,
    );
  });
  // Edge Cases
  it("should throw an error for name with empty string", () => {
    expect(() => assertValidName("", "component")).toThrow(
      `component "" must only contain letters, numbers, underscores, and hyphens.`,
    );
  });
});
