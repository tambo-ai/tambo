import TamboAI from "@tambo-ai/typescript-sdk";

/**
 *
 */
export function threadMessagesToLegacyMessages(
  messages: TamboAI.Beta.Threads.ThreadMessage[],
) {
  return messages
    .map(
      (m): TamboAI.Components.LegacyChatMessage => ({
        sender: m.role as "user" | "hydra",
        message: m.content[0].text ?? "",
      }),
    )
    .filter((m) => !!m.message);
}
