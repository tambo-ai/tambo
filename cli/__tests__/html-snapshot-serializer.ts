/**
 * Custom Jest snapshot serializer that formats HTML strings for readable diffs.
 * Uses diffable-html which is actively maintained and purpose-built for this.
 */

import toDiffableHtml from "diffable-html";

function isHtmlString(val: unknown): val is string {
  return (
    typeof val === "string" &&
    val.startsWith("<") &&
    val.endsWith(">") &&
    val.includes("</")
  );
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
