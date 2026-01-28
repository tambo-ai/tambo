export const getMessageText = (message: {
  content?: Array<{ type?: string; text?: string }>;
}) => {
  return (message.content ?? [])
    .map((part) => {
      if (part.type === "text" && typeof part.text === "string") {
        return part.text;
      }
      return "";
    })
    .join(" ")
    .trim();
};
