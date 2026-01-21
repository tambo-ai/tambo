import {
  f,
  formatTemplate,
  getTemplate,
  getTemplateVariables,
  objectTemplate,
} from "./template";

//tests f(), objectTemplate() and helper functions

describe("f - tagged template literal", () => {
  it("returns variables from template string", () => {
    const t = f("Hello {name}");
    expect(getTemplateVariables(t)).toEqual(["name"]);
  });

  it("returns multiple variables", () => {
    const t = f("Hello {name}, you are {age}");
    expect(getTemplateVariables(t)).toEqual(["name", "age"]);
  });

  it("stores the original template string", () => {
    const t = f("Hello {name}");
    expect(getTemplate(t)).toBe("Hello {name}");
  });

  it("formats template with single variable", () => {
    const t = f("Hello {name}");
    const out = formatTemplate(t, { name: "user" });
    expect(out).toBe("Hello user");
  });

  it("formats template with multiple variables", () => {
    const t = f("Hello {name}, age {age}");
    const out = formatTemplate(t, { name: "user", age: "1" });
    expect(out).toBe("Hello user, age 1");
  });

  it("throws if variable is missing", () => {
    const t = f("Hello {name}");
    expect(() => formatTemplate(t, {})).toThrow();
  });
});

describe("objectTemplate - templates for nested objects", () => {
  it("formats object with single variable", () => {
    const t = objectTemplate({ msg: "Hello {name}" });
    const out = formatTemplate(t, { name: "user" });

    expect(out).toEqual({ msg: "Hello user" });
  });

  it("formats object with nested variables", () => {
    const t = objectTemplate({
      user: { greeting: "Hello {name}" },
    });
    const out = formatTemplate(t, { name: "user" });

    expect(out.user.greeting).toBe("Hello user");
  });

  it("formats array with variables", () => {
    const t = objectTemplate(["Hello {name}", "age is {age}"]);
    const out = formatTemplate(t, { name: "user", age: "1" });

    expect(out).toEqual(["Hello user", "age is 1"]);
  });

  it("formats array of objects correctly (e.g. ThreadMessage[])", () => {
    const t = objectTemplate([
      { role: "user", content: "Hello {name}" },
      { role: "assistant", content: "Hi there" },
    ]);
    const out = formatTemplate(t, { name: "Alice" });
    expect(out).toEqual([
      { role: "user", content: "Hello Alice" },
      { role: "assistant", content: "Hi there" },
    ]);
  });

  it("treats previous chat_history special objects as normal objects", () => {
    const t = objectTemplate([{ role: "chat_history", content: "{val}" }]);
    const out = formatTemplate(t, { val: "expanded" });
    // Should be treated as normal object, not expanded into array
    expect(out).toEqual([{ role: "chat_history", content: "expanded" }]);
  });

  it("throws if input is not object or string", () => {
    expect(() => objectTemplate(5 as unknown as object)).toThrow(
      "Can only generate object templates for objects or strings",
    );
  });
});
