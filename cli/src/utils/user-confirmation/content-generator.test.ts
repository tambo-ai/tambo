/**
 * Tests for content generation utilities
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { generateContentForRecommendation } from "./content-generator.js";

describe("generateContentForRecommendation", () => {
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {}) as jest.SpiedFunction<typeof console.warn>;
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe("provider setup", () => {
    it("should wrap JSX children in TamboProvider", () => {
      const existingContent = `import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

      const recommendation = {
        type: "provider" as const,
        filePath: "app/layout.tsx",
        plan: {
          providerSetup: {
            filePath: "app/layout.tsx",
            nestingLevel: 0,
            rationale: "Test",
            confidence: 1.0,
          },
        },
      };

      const result = generateContentForRecommendation(
        recommendation,
        existingContent,
      );

      // Should add TamboProvider import
      expect(result).toContain(
        'import { TamboProvider } from "@tambo-ai/react"',
      );

      // Should wrap children in TamboProvider
      expect(result).toContain("<TamboProvider>");
      expect(result).toContain("</TamboProvider>");
    });
  });

  describe("component registration", () => {
    it("should append suggestedRegistration snippet", () => {
      const existingContent = `import { Button } from "./ui/button";

export function MyButton() {
  return <Button>Click me</Button>;
}
`;

      const recommendation = {
        type: "component" as const,
        filePath: "components/my-button.tsx",
        plan: {
          componentRecommendations: [
            {
              name: "MyButton",
              filePath: "components/my-button.tsx",
              reason: "Test",
              confidence: 1.0,
              suggestedRegistration: `registerComponent("my-button", MyButton);`,
            },
          ],
        },
      };

      const result = generateContentForRecommendation(
        recommendation,
        existingContent,
      );

      // Should append registration snippet
      expect(result).toContain(existingContent);
      expect(result).toContain('registerComponent("my-button", MyButton);');
    });
  });

  describe("tool creation", () => {
    it("should return complete tool file template", () => {
      const recommendation = {
        type: "tool" as const,
        filePath: "tools/get-weather.ts",
        plan: {
          toolRecommendations: [
            {
              name: "getWeather",
              type: "exported-function" as const,
              filePath: "tools/get-weather.ts",
              reason: "Test",
              confidence: 1.0,
              suggestedSchema: `z.object({ city: z.string() })`,
            },
          ],
        },
      };

      const result = generateContentForRecommendation(recommendation, "");

      // Should contain imports
      expect(result).toContain('import { z } from "zod"');

      // Should contain schema
      expect(result).toContain("export const getWeatherSchema");
      expect(result).toContain("z.object({ city: z.string() })");

      // Should contain function stub
      expect(result).toContain("export async function getWeather");
      expect(result).toContain("z.infer<typeof getWeatherSchema>");
      expect(result).toContain("// TODO: Implement tool logic");
    });
  });

  describe("interactable", () => {
    it("should add useTamboInteractable hook and ref prop", () => {
      const existingContent = `import { useState } from "react";

export function MyComponent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}
`;

      const recommendation = {
        type: "interactable" as const,
        filePath: "components/my-component.tsx",
        plan: {},
      };

      const result = generateContentForRecommendation(
        recommendation,
        existingContent,
      );

      // Should add import
      expect(result).toContain(
        'import { useTamboInteractable } from "@tambo-ai/react"',
      );

      // Should add hook call
      expect(result).toContain("const { ref } = useTamboInteractable();");

      // Should add ref prop to first element
      expect(result).toContain("ref={ref}");
    });
  });

  describe("chat widget", () => {
    it("should add TamboChatWidget import and component", () => {
      const existingContent = `import { Header } from "./header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Header />
      <main>{children}</main>
    </div>
  );
}
`;

      const recommendation = {
        type: "chat-widget" as const,
        filePath: "app/layout.tsx",
        plan: {
          chatWidgetSetup: {
            filePath: "app/layout.tsx",
            position: "bottom-right" as const,
            rationale: "Test",
            confidence: 1.0,
          },
        },
      };

      const result = generateContentForRecommendation(
        recommendation,
        existingContent,
      );

      // Should add import
      expect(result).toContain(
        'import { TamboChatWidget } from "@tambo-ai/react"',
      );

      // Should add widget component
      expect(result).toContain("<TamboChatWidget");
      expect(result).toContain('position="bottom-right"');
    });
  });

  describe("fallback behavior", () => {
    it("should return original content unchanged when pattern matching fails", () => {
      const existingContent = "// Malformed content with no clear structure";

      const recommendation = {
        type: "provider" as const,
        filePath: "weird-file.tsx",
        plan: {
          providerSetup: {
            filePath: "weird-file.tsx",
            nestingLevel: 0,
            rationale: "Test",
            confidence: 1.0,
          },
        },
      };

      const result = generateContentForRecommendation(
        recommendation,
        existingContent,
      );

      // Should return original content
      expect(result).toBe(existingContent);

      // Should log a warning
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });
});
