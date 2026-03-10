import type { Content } from "@tambo-ai/react";

/**
 * Checks if a content block is a text content block.
 * @param item - A content block
 * @returns True if the item is a TextContent block
 */
export function isTextContent(
  item: Content,
): item is Extract<Content, { type: "text" }> {
  return item.type === "text";
}

/**
 * Checks if a content block is a component content block.
 * @param item - A content block
 * @returns True if the item is a TamboComponentContent block
 */
export function isComponentContent(
  item: Content,
): item is Extract<Content, { type: "component" }> {
  return item.type === "component";
}

/**
 * Checks if a content block is a tool use content block.
 * @param item - A content block
 * @returns True if the item is a TamboToolUseContent block
 */
export function isToolUseContent(
  item: Content,
): item is Extract<Content, { type: "tool_use" }> {
  return item.type === "tool_use";
}

/**
 * Checks if a content block is a tool result content block.
 * @param item - A content block
 * @returns True if the item is a ToolResultContent block
 */
export function isToolResultContent(
  item: Content,
): item is Extract<Content, { type: "tool_result" }> {
  return item.type === "tool_result";
}

/**
 * Checks if a content block is a resource content block.
 * @param item - A content block
 * @returns True if the item is a ResourceContent block
 */
export function isResourceContent(
  item: Content,
): item is Extract<Content, { type: "resource" }> {
  return item.type === "resource";
}

function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

function isStringWithLength(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Checks if a content array contains any text content blocks.
 * @param content - Array of content blocks
 * @returns True if any block is a text content block
 */
export function hasTextContent(
  content?: string | Content[],
): ReturnType<typeof isTextContent> {
  if (isUndefined(content)) return false;
  if (isStringWithLength(content)) return false;
  return content.some(isTextContent);
}

/**
 * Checks if a content array contains any component content blocks.
 * @param content - Array of content blocks
 * @returns True if any block is a component content block
 */
export function hasComponentContent(
  content?: string | Content[],
): ReturnType<typeof isComponentContent> {
  if (isUndefined(content)) return false;
  if (isStringWithLength(content)) return false;
  return content.some(isComponentContent);
}

/**
 * Checks if a content array contains any tool use content blocks.
 * @param content - Array of content blocks
 * @returns True if any block is a tool use content block
 */
export function hasToolUseContent(
  content?: string | Content[],
): ReturnType<typeof isToolUseContent> {
  if (isUndefined(content)) return false;
  if (isStringWithLength(content)) return false;
  return content.some(isToolUseContent);
}

/**
 * Checks if a content array contains any tool result content blocks.
 * @param content - Array of content blocks
 * @returns True if any block is a tool result content block
 */
export function hasToolResultContent(
  content?: string | Content[],
): ReturnType<typeof isToolResultContent> {
  if (isUndefined(content)) return false;
  if (isStringWithLength(content)) return false;
  return content.some(isToolResultContent);
}

/**
 * Checks if a content array contains any resource content blocks.
 * @param content - Array of content blocks
 * @returns True if any block is a resource content block
 */
export function hasResourceContent(
  content?: string | Content[],
): ReturnType<typeof isResourceContent> {
  if (isUndefined(content)) return false;
  if (isStringWithLength(content)) return false;
  return content.some(isResourceContent);
}
