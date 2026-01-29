/**
 * Tambo AI Chat Component
 *
 * A reusable chat component that integrates with Tambo AI.
 * This demonstrates how to build a conversational UI with Tambo AI.
 */

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { tamboClient } from "@/lib/tambo-config";
import React, { useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function TamboChat() {
  const colorScheme = useColorScheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call Tambo AI API
      // Note: Adjust this based on actual Tambo AI SDK methods
      const response = await tamboClient.chat.completions.create({
        messages: [
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user", content: userMessage.content },
        ],
        model: "gpt-4",
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.choices[0]?.message?.content || "No response",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error calling Tambo AI:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, there was an error processing your request. Please check your API key and try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText type="subtitle" style={styles.emptyText}>
              👋 Start a conversation with Tambo AI
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Ask me anything!
            </ThemedText>
          </View>
        ) : (
          messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.role === "user"
                  ? styles.userMessage
                  : styles.assistantMessage,
              ]}
            >
              <ThemedText
                style={[
                  styles.messageText,
                  message.role === "user" && styles.userMessageText,
                ]}
              >
                {message.content}
              </ThemedText>
            </View>
          ))
        )}
        {isLoading && (
          <View style={[styles.messageBubble, styles.assistantMessage]}>
            <ActivityIndicator
              size="small"
              color={Colors[colorScheme ?? "light"].tint}
            />
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.inputContainer,
          { borderTopColor: Colors[colorScheme ?? "light"].border },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: Colors[colorScheme ?? "light"].inputBackground,
              color: Colors[colorScheme ?? "light"].text,
            },
          ]}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          placeholderTextColor={Colors[colorScheme ?? "light"].tabIconDefault}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: Colors[colorScheme ?? "light"].tint,
              opacity: !input.trim() || isLoading ? 0.5 : 1,
            },
          ]}
          onPress={sendMessage}
          disabled={!input.trim() || isLoading}
        >
          <ThemedText style={styles.sendButtonText}>Send</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: "center",
    opacity: 0.7,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
  },
  assistantMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#E9ECEF",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
