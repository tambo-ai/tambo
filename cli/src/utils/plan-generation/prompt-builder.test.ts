/**
 * Tests for buildPlanPrompt function
 *
 * These tests verify that:
 * - Prompt includes all required project context
 * - Components and tools are limited to top 10
 * - Empty arrays are handled gracefully
 * - Output format instructions are included
 */

import { describe, it, expect } from "@jest/globals";
import { buildPlanPrompt } from "./prompt-builder.js";
import type { ProjectAnalysis } from "../project-analysis/types.js";

describe("buildPlanPrompt", () => {
  const createMockAnalysis = (
    overrides: Partial<ProjectAnalysis> = {},
  ): ProjectAnalysis => ({
    framework: {
      name: "next",
      displayName: "Next.js",
      envPrefix: "NEXT_PUBLIC_",
      variant: "next-app-router",
    },
    structure: {
      hasSrcDir: true,
      srcPath: "/src",
      appDirPath: "/src/app",
      pagesDirPath: null,
      componentsDirs: ["/src/components"],
      rootLayoutPath: "/src/app/layout.tsx",
    },
    typescript: {
      isTypeScript: true,
      configPath: "/tsconfig.json",
      strict: true,
    },
    packageManager: "npm",
    providers: [],
    components: [],
    toolCandidates: [],
    ...overrides,
  });

  it("includes framework display name", () => {
    const analysis = createMockAnalysis();
    const prompt = buildPlanPrompt(analysis);

    expect(prompt).toContain("Next.js");
  });

  it("includes TypeScript strict mode info", () => {
    const analysis = createMockAnalysis({
      typescript: {
        isTypeScript: true,
        configPath: "/tsconfig.json",
        strict: true,
      },
    });
    const prompt = buildPlanPrompt(analysis);

    expect(prompt).toContain("TypeScript");
    expect(prompt).toContain("strict");
  });

  it("includes package manager", () => {
    const analysis = createMockAnalysis({ packageManager: "pnpm" });
    const prompt = buildPlanPrompt(analysis);

    expect(prompt).toContain("pnpm");
  });

  it("lists providers with names and import sources", () => {
    const analysis = createMockAnalysis({
      providers: [
        {
          name: "ThemeProvider",
          importSource: "next-themes",
          filePath: "/src/app/layout.tsx",
          nestingLevel: 0,
        },
        {
          name: "AuthProvider",
          importSource: "@/contexts/auth",
          filePath: "/src/app/layout.tsx",
          nestingLevel: 1,
        },
      ],
    });
    const prompt = buildPlanPrompt(analysis);

    expect(prompt).toContain("ThemeProvider");
    expect(prompt).toContain("next-themes");
    expect(prompt).toContain("AuthProvider");
    expect(prompt).toContain("@/contexts/auth");
  });

  it("limits components to 10 and shows 'and N more' when >10", () => {
    const components = Array.from({ length: 15 }, (_, i) => ({
      name: `Component${i + 1}`,
      filePath: `/components/Component${i + 1}.tsx`,
      isExported: true,
      hasProps: true,
      hooks: ["useState"],
    }));

    const analysis = createMockAnalysis({ components });
    const prompt = buildPlanPrompt(analysis);

    // First 10 should be included
    expect(prompt).toContain("Component1");
    expect(prompt).toContain("Component10");

    // Components beyond 10 should not be listed
    expect(prompt).not.toContain("Component11");
    expect(prompt).not.toContain("Component15");

    // Should show "and N more"
    expect(prompt).toContain("and 5 more");
  });

  it("limits tool candidates to 10 and shows 'and N more' when >10", () => {
    const toolCandidates = Array.from({ length: 20 }, (_, i) => ({
      name: `tool${i + 1}`,
      filePath: `/lib/tool${i + 1}.ts`,
      type: "exported-function" as const,
      description: `Description ${i + 1}`,
    }));

    const analysis = createMockAnalysis({ toolCandidates });
    const prompt = buildPlanPrompt(analysis);

    // First 10 should be included
    expect(prompt).toContain("tool1");
    expect(prompt).toContain("tool10");

    // Tools beyond 10 should not be listed
    expect(prompt).not.toContain("tool11");
    expect(prompt).not.toContain("tool20");

    // Should show "and N more"
    expect(prompt).toContain("and 10 more");
  });

  it("handles empty providers gracefully", () => {
    const analysis = createMockAnalysis({ providers: [] });
    const prompt = buildPlanPrompt(analysis);

    // Should mention providers section exists
    expect(prompt).toContain("Existing Providers");
  });

  it("handles empty components gracefully", () => {
    const analysis = createMockAnalysis({ components: [] });
    const prompt = buildPlanPrompt(analysis);

    // Should mention components section exists
    expect(prompt).toContain("Available Components");
  });

  it("handles empty tool candidates gracefully", () => {
    const analysis = createMockAnalysis({ toolCandidates: [] });
    const prompt = buildPlanPrompt(analysis);

    // Should mention tool candidates section exists
    expect(prompt).toContain("Tool Candidates");
  });

  it("includes JSON output format instruction", () => {
    const analysis = createMockAnalysis();
    const prompt = buildPlanPrompt(analysis);

    expect(prompt).toContain("JSON");
    expect(prompt).toContain("providerSetup");
    expect(prompt).toContain("componentRecommendations");
    expect(prompt).toContain("toolRecommendations");
    expect(prompt).toContain("interactableRecommendations");
    expect(prompt).toContain("chatWidgetSetup");
  });

  it("includes ONLY valid JSON instruction", () => {
    const analysis = createMockAnalysis();
    const prompt = buildPlanPrompt(analysis);

    expect(prompt).toContain("ONLY");
    expect(prompt).toContain("valid JSON");
  });

  it("includes quality guidance about confidence threshold", () => {
    const analysis = createMockAnalysis();
    const prompt = buildPlanPrompt(analysis);

    expect(prompt).toContain("high-confidence");
    expect(prompt).toContain("0.7");
  });

  it("includes guidance to prioritize user-facing components", () => {
    const analysis = createMockAnalysis();
    const prompt = buildPlanPrompt(analysis);

    expect(prompt).toContain("user-facing");
  });

  it("includes guidance to reference specific files", () => {
    const analysis = createMockAnalysis();
    const prompt = buildPlanPrompt(analysis);

    expect(prompt).toContain("specific");
    expect(prompt).toContain("file");
  });
});
