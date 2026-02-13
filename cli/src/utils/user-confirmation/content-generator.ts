/**
 * Utilities for generating modified file content from recommendations
 *
 * These functions perform template-based transformations to apply
 * installation plan recommendations to existing files.
 */

import type { InstallationPlan } from "../plan-generation/types.js";

/**
 * Recommendation item with type discriminator
 */
type Recommendation =
  | {
      type: "provider";
      filePath: string;
      plan: Pick<InstallationPlan, "providerSetup">;
    }
  | {
      type: "component";
      filePath: string;
      plan: Pick<InstallationPlan, "componentRecommendations">;
    }
  | {
      type: "tool";
      filePath: string;
      plan: Pick<InstallationPlan, "toolRecommendations">;
    }
  | {
      type: "interactable";
      filePath: string;
      plan: object;
    }
  | {
      type: "chat-widget";
      filePath: string;
      plan: Pick<InstallationPlan, "chatWidgetSetup">;
    };

/**
 * Generate modified file content for a recommendation
 *
 * Takes a recommendation and existing file content, applies template-based
 * transformations, and returns the full modified file content.
 *
 * @param recommendation - Recommendation item with type and plan details
 * @param existingContent - Current file content (empty for new files)
 * @returns Modified file content
 */
export function generateContentForRecommendation(
  recommendation: Recommendation,
  existingContent: string,
): string {
  switch (recommendation.type) {
    case "provider":
      return applyProviderSetup(existingContent);

    case "component":
      return applyComponentRegistration(
        existingContent,
        recommendation.plan.componentRecommendations[0]
          ?.suggestedRegistration ?? "",
      );

    case "tool":
      return applyToolCreation(recommendation.plan.toolRecommendations[0]);

    case "interactable":
      return applyInteractable(existingContent);

    case "chat-widget":
      return applyChatWidget(
        existingContent,
        recommendation.plan.chatWidgetSetup.position,
      );
  }
}

/**
 * Apply provider setup: wrap JSX children in TamboProvider
 */
function applyProviderSetup(content: string): string {
  try {
    // Find the last import statement
    const importRegex = /^import\s+.+from\s+.+;?\s*$/gm;
    const imports = [...content.matchAll(importRegex)];

    if (imports.length === 0) {
      console.warn("Could not find import statements for provider setup");
      return content;
    }

    const lastImport = imports[imports.length - 1];
    const lastImportEnd = (lastImport.index ?? 0) + lastImport[0].length;

    // Insert TamboProvider import after last import
    const tamboImport = '\nimport { TamboProvider } from "@tambo-ai/react";';
    const withImport =
      content.slice(0, lastImportEnd) +
      tamboImport +
      content.slice(lastImportEnd);

    // Find the return statement and wrap its JSX content
    // Look for: return ( ... JSX ... );
    const returnMatch = /return\s*\(\s*\n/.exec(withImport);

    if (returnMatch?.index === undefined) {
      console.warn("Could not find return statement for provider setup");
      return content;
    }

    // Find the matching closing parenthesis
    // Simple heuristic: find the last occurrence of ); before the closing brace
    const afterReturn = withImport.slice(returnMatch.index);
    const closingMatch = /\n\s*\);?\s*\n\s*\}/.exec(afterReturn);

    if (closingMatch?.index === undefined) {
      console.warn(
        "Could not find closing parenthesis for provider setup return",
      );
      return content;
    }

    const returnStart = returnMatch.index + returnMatch[0].length;
    const returnEnd = returnMatch.index + closingMatch.index;

    // Extract JSX content
    const jsxContent = withImport.slice(returnStart, returnEnd);

    // Wrap in TamboProvider
    const wrappedJsx = `    <TamboProvider>\n${jsxContent}\n    </TamboProvider>\n`;

    return (
      withImport.slice(0, returnStart) +
      wrappedJsx +
      withImport.slice(returnEnd)
    );
  } catch {
    console.warn("Failed to apply provider setup transformation");
    return content;
  }
}

/**
 * Apply component registration: append suggestedRegistration snippet
 */
function applyComponentRegistration(
  content: string,
  suggestedRegistration: string,
): string {
  if (!suggestedRegistration) {
    return content;
  }

  // Remove trailing newlines
  const trimmedContent = content.trimEnd();

  // Append registration with blank line separator
  return `${trimmedContent}\n\n${suggestedRegistration}\n`;
}

/**
 * Apply tool creation: generate complete tool file template
 */
function applyToolCreation(
  toolRec: { name: string; suggestedSchema: string } | undefined,
): string {
  if (!toolRec) {
    return "";
  }

  const { name, suggestedSchema } = toolRec;

  return `import { z } from "zod";

export const ${name}Schema = ${suggestedSchema};

export async function ${name}(input: z.infer<typeof ${name}Schema>) {
  // TODO: Implement tool logic
  throw new Error("Not implemented");
}
`;
}

/**
 * Apply interactable: add useTamboInteractable hook and ref prop
 */
function applyInteractable(content: string): string {
  try {
    // Find the last import statement
    const importRegex = /^import\s+.+from\s+.+;?\s*$/gm;
    const imports = [...content.matchAll(importRegex)];

    if (imports.length === 0) {
      console.warn("Could not find import statements for interactable");
      return content;
    }

    const lastImport = imports[imports.length - 1];
    const lastImportEnd = (lastImport.index ?? 0) + lastImport[0].length;

    // Insert hook import
    const hookImport =
      '\nimport { useTamboInteractable } from "@tambo-ai/react";';
    const withImport =
      content.slice(0, lastImportEnd) +
      hookImport +
      content.slice(lastImportEnd);

    // Find component function body (first { after function/arrow)
    const functionMatch = /export\s+function\s+\w+\([^)]*\)\s*\{/.exec(withImport);

    if (functionMatch?.index === undefined) {
      console.warn("Could not find function body for interactable");
      return content;
    }

    const bodyStart = functionMatch.index + functionMatch[0].length;

    // Insert hook call at start of function body
    const hookCall = "\n  const { ref } = useTamboInteractable();\n";
    const withHook =
      withImport.slice(0, bodyStart) + hookCall + withImport.slice(bodyStart);

    // Find first JSX element in return statement
    const returnJsxMatch = /return\s*\(\s*\n\s*<(\w+)/.exec(withHook);

    if (returnJsxMatch?.index === undefined) {
      console.warn("Could not find JSX element for interactable ref");
      return content;
    }

    // Find the end of the opening tag
    const tagStart = returnJsxMatch.index + returnJsxMatch[0].length;
    const afterTag = withHook.slice(tagStart);

    // Find where to insert ref (after tag name, before > or space)
    const insertMatch = /[\s>]/.exec(afterTag);

    if (insertMatch?.index === undefined) {
      console.warn("Could not find insertion point for interactable ref");
      return content;
    }

    const insertPos = tagStart + insertMatch.index;

    // Insert ref prop
    const refProp = " ref={ref}";
    return withHook.slice(0, insertPos) + refProp + withHook.slice(insertPos);
  } catch {
    console.warn("Failed to apply interactable transformation");
    return content;
  }
}

/**
 * Apply chat widget: add TamboChatWidget import and component
 */
function applyChatWidget(
  content: string,
  position: "bottom-right" | "bottom-left" | "top-right" | "sidebar",
): string {
  try {
    // Find the last import statement
    const importRegex = /^import\s+.+from\s+.+;?\s*$/gm;
    const imports = [...content.matchAll(importRegex)];

    if (imports.length === 0) {
      console.warn("Could not find import statements for chat widget");
      return content;
    }

    const lastImport = imports[imports.length - 1];
    const lastImportEnd = (lastImport.index ?? 0) + lastImport[0].length;

    // Insert widget import
    const widgetImport = '\nimport { TamboChatWidget } from "@tambo-ai/react";';
    const withImport =
      content.slice(0, lastImportEnd) +
      widgetImport +
      content.slice(lastImportEnd);

    // Find the closing tag of outermost JSX element in return
    // Look for the last </...> before the closing );
    const closingTagMatch = /\n\s*(<\/\w+>)\s*\n\s*\);/.exec(withImport);

    if (closingTagMatch?.index === undefined) {
      console.warn("Could not find closing tag for chat widget");
      return content;
    }

    const insertPos = closingTagMatch.index + 1; // After newline, before closing tag

    // Insert widget component
    const widget = `      <TamboChatWidget position="${position}" />\n`;

    return (
      withImport.slice(0, insertPos) + widget + withImport.slice(insertPos)
    );
  } catch {
    console.warn("Failed to apply chat widget transformation");
    return content;
  }
}
