import {
  parseSkillContent,
  reconstructSkillContent,
} from "./parse-skill-frontmatter";

describe("parseSkillContent", () => {
  it("parses valid SKILL.md with name, description, and body", () => {
    const content = `---
name: My Skill
description: A brief description
---
Some instructions here.`;

    const result = parseSkillContent(content);
    expect(result).toEqual({
      success: true,
      name: "My Skill",
      description: "A brief description",
      body: "Some instructions here.",
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
name: My Skill
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
name: My Skill
description: A brief description
author: jane
version: 1.0
---
Body`;

    const result = parseSkillContent(content);
    expect(result).toEqual({
      success: true,
      name: "My Skill",
      description: "A brief description",
      body: "Body",
    });
  });

  it("handles YAML-special characters in name and description", () => {
    const content = `---
name: "Step 1: Do the thing"
description: "It's a 'quoted' description with: colons"
---
Body`;

    const result = parseSkillContent(content);
    expect(result).toEqual({
      success: true,
      name: "Step 1: Do the thing",
      description: "It's a 'quoted' description with: colons",
      body: "Body",
    });
  });

  it("handles \\r\\n line endings from Windows paste", () => {
    const content =
      "---\r\nname: My Skill\r\ndescription: A brief description\r\n---\r\nBody";

    const result = parseSkillContent(content);
    expect(result).toEqual({
      success: true,
      name: "My Skill",
      description: "A brief description",
      body: "Body",
    });
  });

  it("handles empty body after frontmatter", () => {
    const content = `---
name: My Skill
description: A brief description
---
`;

    const result = parseSkillContent(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.body).toBe("");
    }
  });
});

describe("reconstructSkillContent", () => {
  it("produces valid SKILL.md format", () => {
    const content = reconstructSkillContent(
      "My Skill",
      "A brief description",
      "Some instructions here.",
    );

    expect(content).toContain("---\n");
    expect(content).toContain("name:");
    expect(content).toContain("description:");
    expect(content).toContain("Some instructions here.");
  });

  it("round-trips: reconstruct then parse yields same values", () => {
    const name = "My Skill";
    const description = "A brief description";
    const instructions = "Some instructions here.";

    const content = reconstructSkillContent(name, description, instructions);
    const result = parseSkillContent(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.name).toBe(name);
      expect(result.description).toBe(description);
      expect(result.body).toBe(instructions);
    }
  });

  it("round-trips with YAML-special characters", () => {
    const name = "Step 1: Do the thing";
    const description = 'It\'s a "quoted" description with: colons & newlines';
    const instructions = "Body content";

    const content = reconstructSkillContent(name, description, instructions);
    const result = parseSkillContent(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.name).toBe(name);
      expect(result.description).toBe(description);
      expect(result.body).toBe(instructions);
    }
  });
});
