// Tests for the skill frontmatter parser now live in packages/core/src/skills-frontmatter.test.ts.
// This file verifies the re-export works correctly.

import {
  parseSkillContent,
  reconstructSkillContent,
} from "./parse-skill-frontmatter";

describe("parse-skill-frontmatter re-export", () => {
  it("re-exports parseSkillContent from packages/core", () => {
    expect(typeof parseSkillContent).toBe("function");

    const result = parseSkillContent(`---
name: test
description: test description
---
instructions`);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.instructions).toBe("instructions");
    }
  });

  it("re-exports reconstructSkillContent from packages/core", () => {
    expect(typeof reconstructSkillContent).toBe("function");

    const content = reconstructSkillContent("test", "desc", "body");
    expect(content).toContain("---");
  });
});
