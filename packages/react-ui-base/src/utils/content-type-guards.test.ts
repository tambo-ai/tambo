import { describe, expect, it } from "@jest/globals";
import type { Content } from "@tambo-ai/react";
import {
  isTextContent,
  isComponentContent,
  isToolUseContent,
  isToolResultContent,
  isResourceContent,
  hasTextContent,
  hasComponentContent,
  hasToolUseContent,
  hasToolResultContent,
  hasResourceContent,
} from "./content-type-guards";

const textBlock: Content = { type: "text", text: "hello" };
const componentBlock: Content = {
  type: "component",
  id: "c1",
  name: "Foo",
  props: {},
};
const toolUseBlock: Content = {
  type: "tool_use",
  id: "t1",
  name: "search",
  input: {},
};
const toolResultBlock: Content = {
  type: "tool_result",
  toolUseId: "t1",
  content: [{ type: "text", text: "result" }],
};
const resourceBlock: Content = {
  type: "resource",
  resource: { uri: "file:///test.txt" },
};

describe("individual type guards", () => {
  it("isTextContent returns true only for text blocks", () => {
    expect(isTextContent(textBlock)).toBe(true);
    expect(isTextContent(componentBlock)).toBe(false);
    expect(isTextContent(toolUseBlock)).toBe(false);
    expect(isTextContent(toolResultBlock)).toBe(false);
    expect(isTextContent(resourceBlock)).toBe(false);
  });

  it("isComponentContent returns true only for component blocks", () => {
    expect(isComponentContent(componentBlock)).toBe(true);
    expect(isComponentContent(textBlock)).toBe(false);
  });

  it("isToolUseContent returns true only for tool_use blocks", () => {
    expect(isToolUseContent(toolUseBlock)).toBe(true);
    expect(isToolUseContent(textBlock)).toBe(false);
  });

  it("isToolResultContent returns true only for tool_result blocks", () => {
    expect(isToolResultContent(toolResultBlock)).toBe(true);
    expect(isToolResultContent(textBlock)).toBe(false);
  });

  it("isResourceContent returns true only for resource blocks", () => {
    expect(isResourceContent(resourceBlock)).toBe(true);
    expect(isResourceContent(textBlock)).toBe(false);
  });
});

describe("array has* helpers", () => {
  it("hasTextContent detects text blocks in array", () => {
    expect(hasTextContent([textBlock, componentBlock])).toBe(true);
    expect(hasTextContent([componentBlock])).toBe(false);
  });

  it("hasComponentContent detects component blocks in array", () => {
    expect(hasComponentContent([textBlock, componentBlock])).toBe(true);
    expect(hasComponentContent([textBlock])).toBe(false);
  });

  it("hasToolUseContent detects tool_use blocks in array", () => {
    expect(hasToolUseContent([toolUseBlock])).toBe(true);
    expect(hasToolUseContent([textBlock])).toBe(false);
  });

  it("hasToolResultContent detects tool_result blocks in array", () => {
    expect(hasToolResultContent([toolResultBlock])).toBe(true);
    expect(hasToolResultContent([textBlock])).toBe(false);
  });

  it("hasResourceContent detects resource blocks in array", () => {
    expect(hasResourceContent([resourceBlock])).toBe(true);
    expect(hasResourceContent([textBlock])).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(hasTextContent(undefined)).toBe(false);
    expect(hasComponentContent(undefined)).toBe(false);
    expect(hasToolUseContent(undefined)).toBe(false);
    expect(hasToolResultContent(undefined)).toBe(false);
    expect(hasResourceContent(undefined)).toBe(false);
  });

  it("returns false for string input", () => {
    expect(hasTextContent("hello")).toBe(false);
    expect(hasComponentContent("hello")).toBe(false);
    expect(hasToolUseContent("hello")).toBe(false);
    expect(hasToolResultContent("hello")).toBe(false);
    expect(hasResourceContent("hello")).toBe(false);
  });

  it("returns false for empty array", () => {
    expect(hasTextContent([])).toBe(false);
    expect(hasComponentContent([])).toBe(false);
    expect(hasToolUseContent([])).toBe(false);
    expect(hasToolResultContent([])).toBe(false);
    expect(hasResourceContent([])).toBe(false);
  });
});
