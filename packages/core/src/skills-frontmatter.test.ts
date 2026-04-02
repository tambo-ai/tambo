import {
  parseSkillContent,
  reconstructSkillContent,
} from "./skills-frontmatter";

describe("parseSkillContent", () => {
  it("parses valid SKILL.md with name, description, and instructions", () => {
    const content = `---
name: my-skill
description: A brief description
---
Some instructions here.`;

    const result = parseSkillContent(content);
    expect(result).toEqual({
      success: true,
      name: "my-skill",
      description: "A brief description",
      instructions: "Some instructions here.",
    });
  });

  it("returns failure when name is missing", () => {
    const content = `---
description: A brief description
---
Body`;

    const result = parseSkillContent(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("'name'");
    }
  });

  it("returns failure when description is missing", () => {
    const content = `---
name: my-skill
---
Body`;

    const result = parseSkillContent(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("'description'");
    }
  });

  it("returns failure for non-string name", () => {
    const content = `---
name: 123
description: A brief description
---
Body`;

    const result = parseSkillContent(content);
    expect(result.success).toBe(false);
  });

  it("returns failure for non-kebab-case name", () => {
    const content = `---
name: My Skill
description: A brief description
---
Body`;

    const result = parseSkillContent(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("kebab-case");
    }
  });

  it("returns failure for invalid YAML syntax", () => {
    const content = `---
name: [unmatched bracket
description: test
---
Body`;

    const result = parseSkillContent(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid YAML in frontmatter");
    }
  });

  it("returns failure for empty string", () => {
    const result = parseSkillContent("");
    expect(result.success).toBe(false);
  });

  it("returns failure when no frontmatter delimiters", () => {
    const result = parseSkillContent("just some text without frontmatter");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("No YAML frontmatter found");
    }
  });

  it("ignores extra frontmatter fields and still extracts name/description", () => {
    const content = `---
name: my-skill
description: A brief description
author: jane
version: 1.0
---
Body`;

    const result = parseSkillContent(content);
    expect(result).toEqual({
      success: true,
      name: "my-skill",
      description: "A brief description",
      instructions: "Body",
    });
  });

  it("handles \\r\\n line endings from Windows paste", () => {
    const content =
      "---\r\nname: my-skill\r\ndescription: A brief description\r\n---\r\nBody";

    const result = parseSkillContent(content);
    expect(result).toEqual({
      success: true,
      name: "my-skill",
      description: "A brief description",
      instructions: "Body",
    });
  });

  it("handles empty instructions after frontmatter", () => {
    const content = `---
name: my-skill
description: A brief description
---
`;

    const result = parseSkillContent(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.instructions).toBe("");
    }
  });

  it("rejects name exceeding max length", () => {
    const longName = "a".repeat(201);
    const content = `---
name: ${longName}
description: A brief description
---
Body`;

    const result = parseSkillContent(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("200");
    }
  });

  it("rejects description exceeding max length", () => {
    const longDesc = "a".repeat(2001);
    const content = `---
name: my-skill
description: "${longDesc}"
---
Body`;

    const result = parseSkillContent(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("2000");
    }
  });
});

describe("reconstructSkillContent", () => {
  it("produces valid SKILL.md format", () => {
    const content = reconstructSkillContent(
      "my-skill",
      "A brief description",
      "Some instructions here.",
    );

    expect(content).toContain("---\n");
    expect(content).toContain("name:");
    expect(content).toContain("description:");
    expect(content).toContain("Some instructions here.");
  });

  it("round-trips: reconstruct then parse yields same values", () => {
    const name = "my-skill";
    const description = "A brief description";
    const instructions = "Some instructions here.";

    const content = reconstructSkillContent(name, description, instructions);
    const result = parseSkillContent(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.name).toBe(name);
      expect(result.description).toBe(description);
      expect(result.instructions).toBe(instructions);
    }
  });

  it("round-trips with special characters in description", () => {
    const name = "my-skill";
    const description = 'It\'s a "quoted" description with: colons & newlines';
    const instructions = "Body content";

    const content = reconstructSkillContent(name, description, instructions);
    const result = parseSkillContent(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.name).toBe(name);
      expect(result.description).toBe(description);
      expect(result.instructions).toBe(instructions);
    }
  });
});
