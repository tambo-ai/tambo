import {
  SKILL_NAME_PATTERN,
  SKILL_NAME_MAX_LENGTH,
  SKILL_DESCRIPTION_MAX_LENGTH,
  SKILL_INSTRUCTIONS_MAX_LENGTH,
  toSkillSlug,
} from "./skills";

describe("skill validation constants", () => {
  it("SKILL_NAME_PATTERN matches kebab-case", () => {
    expect(SKILL_NAME_PATTERN.test("my-skill")).toBe(true);
    expect(SKILL_NAME_PATTERN.test("a")).toBe(true);
    expect(SKILL_NAME_PATTERN.test("code-reviewer-v2")).toBe(true);
  });

  it("SKILL_NAME_PATTERN rejects non-kebab-case", () => {
    expect(SKILL_NAME_PATTERN.test("My Skill")).toBe(false);
    expect(SKILL_NAME_PATTERN.test("my_skill")).toBe(false);
    expect(SKILL_NAME_PATTERN.test("")).toBe(false);
    expect(SKILL_NAME_PATTERN.test("-leading")).toBe(false);
    expect(SKILL_NAME_PATTERN.test("trailing-")).toBe(false);
  });

  it("exports expected limits", () => {
    expect(SKILL_NAME_MAX_LENGTH).toBe(200);
    expect(SKILL_DESCRIPTION_MAX_LENGTH).toBe(2000);
    expect(SKILL_INSTRUCTIONS_MAX_LENGTH).toBe(100_000);
  });
});

describe("toSkillSlug", () => {
  it("converts human-readable names to kebab-case", () => {
    expect(toSkillSlug("Code Review Assistant")).toBe("code-review-assistant");
    expect(toSkillSlug("My Cool Skill")).toBe("my-cool-skill");
  });

  it("passes through already-valid kebab-case", () => {
    expect(toSkillSlug("my-skill")).toBe("my-skill");
    expect(toSkillSlug("code-reviewer-v2")).toBe("code-reviewer-v2");
  });

  it("collapses multiple non-alphanumeric characters", () => {
    expect(toSkillSlug("hello---world")).toBe("hello-world");
    expect(toSkillSlug("foo _ bar")).toBe("foo-bar");
    expect(toSkillSlug("a!!!b")).toBe("a-b");
  });

  it("trims leading and trailing hyphens", () => {
    expect(toSkillSlug("--leading")).toBe("leading");
    expect(toSkillSlug("trailing--")).toBe("trailing");
    expect(toSkillSlug("  spaces  ")).toBe("spaces");
  });

  it("returns empty string for non-alphanumeric input", () => {
    expect(toSkillSlug("!!!")).toBe("");
    expect(toSkillSlug("")).toBe("");
  });

  it("produces output that matches SKILL_NAME_PATTERN", () => {
    const inputs = [
      "Code Review Assistant",
      "my_skill_name",
      "Scheduling Assistant v2",
      "a",
    ];
    for (const input of inputs) {
      const slug = toSkillSlug(input);
      expect(SKILL_NAME_PATTERN.test(slug)).toBe(true);
    }
  });
});
