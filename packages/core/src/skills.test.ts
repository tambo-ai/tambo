import {
  SKILL_NAME_PATTERN,
  SKILL_NAME_MAX_LENGTH,
  SKILL_DESCRIPTION_MAX_LENGTH,
  SKILL_INSTRUCTIONS_MAX_LENGTH,
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
