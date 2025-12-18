/**
 * Custom Jest snapshot serializer that formats HTML strings with proper indentation.
 * This makes snapshot diffs much more readable without changing the actual output.
 */

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

function formatHtml(html: string, indent = 2): string {
  let result = "";
  let depth = 0;
  let i = 0;

  const addIndent = () => "  ".repeat(depth);

  while (i < html.length) {
    // Handle tags
    if (html[i] === "<") {
      const tagEnd = html.indexOf(">", i);
      if (tagEnd === -1) break;

      const tag = html.slice(i, tagEnd + 1);
      const isClosing = tag.startsWith("</");
      const isSelfClosing =
        tag.endsWith("/>") || tag.includes("/>") || tag.endsWith("/ >");
      const tagNameMatch = tag.match(/<\/?([a-zA-Z][a-zA-Z0-9-]*)/);
      const tagName = tagNameMatch?.[1]?.toLowerCase() ?? "";
      const isVoid = VOID_ELEMENTS.has(tagName);

      if (isClosing) {
        depth = Math.max(0, depth - 1);
      }

      // Add newline before tag if we have content
      if (result.length > 0 && !result.endsWith("\n")) {
        result += "\n";
      }
      result += addIndent() + tag;

      if (!isClosing && !isSelfClosing && !isVoid) {
        depth++;
      }

      i = tagEnd + 1;
    } else {
      // Handle text content
      let textEnd = html.indexOf("<", i);
      if (textEnd === -1) textEnd = html.length;

      const text = html.slice(i, textEnd).trim();
      if (text) {
        if (result.length > 0 && !result.endsWith("\n")) {
          result += "\n";
        }
        result += addIndent() + text;
      }
      i = textEnd;
    }
  }

  return result;
}

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
    return formatHtml(val);
  },
};

export default htmlSnapshotSerializer;
