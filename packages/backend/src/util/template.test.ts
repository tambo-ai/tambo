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
    const t = f("Hello {name}, you are {age}");
    const out = formatTemplate(t, { name: "user", age: "1" });
    expect(out).toBe("Hello user, you are 1");
  });

  it("throws if variable is missing", () => {
    const t = f("Hello {name}");
    expect(() => formatTemplate(t, {})).toThrow();
  });
});

describe("objectTemplate - templates for nested objects", () => {
  it("formats a simple object", () => {
    const t = objectTemplate({ msg: "Hello {name}" });
    const out = formatTemplate(t, { name: "user" });

    expect(out).toEqual({ msg: "Hello user" });
  });

  it("formats nested objects", () => {
    const t = objectTemplate({
      user: { greeting: "Hello {name}" },
    });
    const out = formatTemplate(t, { name: "admin" });

    expect(out.user.greeting).toBe("Hello admin");
  });

  it("formats arrays", () => {
    const t = objectTemplate(["Hello {name}", "Bye {name}"]);
    const out = formatTemplate(t, { name: "user" });

    expect(out).toEqual(["Hello user", "Bye user"]);
  });

  it("throws if input is not an object or string", () => {
    expect(() => objectTemplate(5 as unknown as object)).toThrow(
      "Can only generate object templates for objects or strings",
    );
  });
});
