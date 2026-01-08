/**
 * Custom Jest snapshot serializer that formats HTML strings for readable diffs.
 * Uses diffable-html which is actively maintained and purpose-built for this.
 */

import toDiffableHtml from "diffable-html";

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

function isHtmlString(val: unknown): val is string {
  if (typeof val !== "string" || !val.startsWith("<") || !val.endsWith(">")) {
    return false;
  }

  if (val.includes("</") || val.endsWith("/>") || val.includes("/>")) {
    return true;
  }

  const tagNameMatch = val.match(/^<([a-zA-Z][a-zA-Z0-9-]*)\b/);
  const tagName = tagNameMatch?.[1]?.toLowerCase();
  if (!tagName) {
    return false;
  }

  return VOID_ELEMENTS.has(tagName);
}

export const htmlSnapshotSerializer: jest.SnapshotSerializerPlugin = {
  test(val: unknown): boolean {
    return isHtmlString(val);
  },

  serialize(val: string): string {
    return toDiffableHtml(val).trim();
  },
};

export default htmlSnapshotSerializer;
