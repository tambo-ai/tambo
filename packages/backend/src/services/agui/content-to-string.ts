type AguiContentPart =
  | {
      type: "text";
      text: string;
    }
  | {
      type: string;
      mimeType?: string;
    };

export type AguiMessageContent =
  | string
  | undefined
  | readonly AguiContentPart[]
  | Record<string, unknown>
  | null;

export function aguiContentToString(content: AguiMessageContent): string {
  if (typeof content === "string") {
    return content;
  }

  if (content === undefined) {
    return "";
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (part.type === "text") {
          return part.text;
        }

        return `[binary:${part.mimeType}]`;
      })
      .join("\n");
  }

  return JSON.stringify(content);
}
