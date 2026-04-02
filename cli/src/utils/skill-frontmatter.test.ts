import { describe, expect, it } from "@jest/globals";
import {
  parseSkillContent,
  reconstructSkillContent,
} from "./skill-frontmatter";

describe("parseSkillContent (CLI copy)", () => {
  it("parses valid frontmatter", () => {
    const result = parseSkillContent(
      "---\nname: my-skill\ndescription: A test\n---\nBody here",
    );
    expect(result).toEqual({
      success: true,
      name: "my-skill",
      description: "A test",
      instructions: "Body here",
    });
  });

  it("rejects missing name", () => {
    const result = parseSkillContent("---\ndescription: A test\n---\nBody");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("name");
    }
  });

  it("rejects missing description", () => {
    const result = parseSkillContent("---\nname: my-skill\n---\nBody");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("description");
    }
  });

  it("rejects non-kebab-case name", () => {
    const result = parseSkillContent(
      "---\nname: My Skill\ndescription: A test\n---\nBody",
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("kebab-case");
    }
  });

  it("rejects numeric name", () => {
    const result = parseSkillContent(
      "---\nname: 123\ndescription: A test\n---\nBody",
    );
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding max length", () => {
    const longName = "a".repeat(201);
    const result = parseSkillContent(
      `---\nname: ${longName}\ndescription: A test\n---\nBody`,
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("200");
    }
  });

  it("rejects description exceeding max length", () => {
    const longDesc = "a".repeat(2001);
    const result = parseSkillContent(
      `---\nname: my-skill\ndescription: "${longDesc}"\n---\nBody`,
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("2000");
    }
  });

  it("rejects no frontmatter", () => {
    const result = parseSkillContent("just text");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("No YAML frontmatter");
    }
  });

  it("rejects invalid YAML", () => {
    const result = parseSkillContent(
      "---\nname: [bad\ndescription: test\n---\nBody",
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid YAML in frontmatter");
    }
  });

  it("handles Windows line endings", () => {
    const result = parseSkillContent(
      "---\r\nname: my-skill\r\ndescription: A test\r\n---\r\nBody",
    );
    expect(result.success).toBe(true);
  });
});

describe("reconstructSkillContent (CLI copy)", () => {
  it("round-trips with parseSkillContent", () => {
    const content = reconstructSkillContent("my-skill", "A desc", "Body");
    const result = parseSkillContent(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.name).toBe("my-skill");
      expect(result.description).toBe("A desc");
      expect(result.instructions).toBe("Body");
    }
  });
});
