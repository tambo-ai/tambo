import { View, Text, Image, StyleSheet } from "react-native";
import type {
  TamboThreadMessage,
  Content,
  ToolResultContent,
} from "@tambo-ai/react";
import { QuickAnswer } from "./quick-answer";
import { resolvePrompt } from "../lib/tools";

interface LogEntryProps {
  message: TamboThreadMessage;
}

export function LogEntry({ message }: LogEntryProps) {
  if (message.role === "system") return null;

  const isUser = message.role === "user";

  return (
    <View style={[styles.row, isUser && styles.userRow]}>
      {message.content.map((block, i) => (
        <ContentBlock
          key={i}
          block={block}
          isUser={isUser}
          allContent={message.content}
        />
      ))}
    </View>
  );
}

function ContentBlock({
  block,
  isUser,
  allContent,
}: {
  block: Content;
  isUser: boolean;
  allContent: Content[];
}) {
  if (block.type === "text" && block.text.trim()) {
    return (
      <View
        style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}
      >
        <Text style={[styles.text, isUser && styles.userText]}>
          {block.text}
        </Text>
      </View>
    );
  }

  if (block.type === "tool_use" && block.name === "ask_multiple_choice") {
    const input = block.input as { question: string; options: string[] };

    // Find matching tool_result to determine if already answered
    const toolResult = allContent.find(
      (b): b is ToolResultContent =>
        b.type === "tool_result" && b.toolUseId === block.id,
    );

    let selectedOption: string | undefined;
    if (toolResult) {
      try {
        const parsed =
          typeof toolResult.content === "string"
            ? JSON.parse(toolResult.content)
            : toolResult.content;
        selectedOption = parsed.selected;
      } catch {
        // If parsing fails, leave as undefined
      }
    }

    return (
      <View style={styles.toolContainer}>
        <QuickAnswer
          question={input.question}
          options={input.options}
          selectedOption={selectedOption}
          onSelect={(opt) => resolvePrompt({ selected: opt })}
        />
      </View>
    );
  }

  if (block.type === "resource" && "resource" in block) {
    const resource = block.resource as {
      name?: string;
      mimeType?: string;
      blob?: string;
    };
    if (resource.mimeType?.startsWith("image/") && resource.blob) {
      return (
        <Image
          source={{ uri: `data:${resource.mimeType};base64,${resource.blob}` }}
          style={styles.image}
          resizeMode="cover"
        />
      );
    }
  }

  // Skip tool_result blocks (rendered inline with tool_use)
  return null;
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 4,
  },
  userRow: {
    alignItems: "flex-end",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: "#2563eb",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: "#f0f0f0",
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
    color: "#1a1a1a",
  },
  userText: {
    color: "#ffffff",
  },
  toolContainer: {
    maxWidth: "90%",
    paddingVertical: 4,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
});
