/**
 * JSON extraction from LLM text responses
 *
 * Handles various LLM output formats: markdown code blocks, raw JSON, mixed text.
 */

/**
 * Extracts JSON from LLM text response.
 *
 * Tries extraction in this priority order:
 * 1. Markdown JSON code block (```json or ```)
 * 2. JSON object in text (outermost {...})
 * 3. JSON array in text (outermost [...])
 * 4. Entire text as JSON
 *
 * @param text - Raw text response from LLM
 * @returns Parsed JSON value
 * @throws Error if JSON extraction fails with truncated input for debugging
 */
export function extractJsonFromResponse(text: string): unknown {
  // Strategy 1: Try markdown code block with json language tag
  const jsonBlockMatch = /```json\s*\n([\s\S]*?)\n```/.exec(text);
  if (jsonBlockMatch) {
    try {
      return JSON.parse(jsonBlockMatch[1]);
    } catch {
      // Fall through to next strategy
    }
  }

  // Strategy 2: Try markdown code block without language tag
  const codeBlockMatch = /```\s*\n([\s\S]*?)\n```/.exec(text);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch {
      // Fall through to next strategy
    }
  }

  // Strategy 3: Try to find JSON object (greedy match for outermost braces)
  const objectMatch = /\{[\s\S]*\}/.exec(text);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      // Fall through to next strategy
    }
  }

  // Strategy 4: Try to find JSON array (greedy match for outermost brackets)
  const arrayMatch = /\[[\s\S]*\]/.exec(text);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {
      // Fall through to next strategy
    }
  }

  // Strategy 5: Try parsing entire text as JSON
  try {
    return JSON.parse(text.trim());
  } catch {
    // All strategies failed
  }

  // All strategies failed - throw descriptive error with truncated text
  const truncated = text.slice(0, 200);
  throw new Error(
    `Failed to extract JSON from response: ${truncated}${text.length > 200 ? "..." : ""}`,
  );
}
