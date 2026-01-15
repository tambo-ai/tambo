export function aguiContentToString(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (content === undefined) {
    return "";
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        const partRecord: Record<string, unknown> | undefined =
          typeof part === "object" && part !== null
            ? (part as Record<string, unknown>)
            : undefined;

        if (
          partRecord?.type === "text" &&
          typeof partRecord.text === "string"
        ) {
          return partRecord.text;
        }

        return `[binary:${partRecord ? `${partRecord.mimeType}` : "undefined"}]`;
      })
      .join("\n");
  }

  return JSON.stringify(content);
}
