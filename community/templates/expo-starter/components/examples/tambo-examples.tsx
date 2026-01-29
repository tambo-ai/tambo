/**
 * Example: Using Tambo AI Hooks
 *
 * This file demonstrates different ways to use Tambo AI in your components.
 * Copy these examples to create your own AI-powered features.
 */

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTamboChat, useTamboCompletion } from "@/hooks/use-tambo";
import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

/**
 * Example 1: Simple Chat Component using useTamboChat hook
 */
export function SimpleChatExample() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, isLoading } = useTamboChat({
    systemPrompt: "You are a helpful and friendly assistant.",
  });

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input);
    setInput("");
  };

  return (
    <ThemedView style={styles.container}>
      <View>
        {messages.map((msg, idx) => (
          <ThemedText key={idx}>
            {msg.role}: {msg.content}
          </ThemedText>
        ))}
      </View>
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Type a message..."
        style={styles.input}
      />
      <TouchableOpacity onPress={handleSend} disabled={isLoading}>
        <ThemedText>{isLoading ? "Sending..." : "Send"}</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

/**
 * Example 2: Text Generator using useTamboCompletion hook
 */
export function TextGeneratorExample() {
  const [prompt, setPrompt] = useState("");
  const { complete, result, isLoading } = useTamboCompletion({
    temperature: 0.8,
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    await complete(prompt);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">AI Text Generator</ThemedText>

      <TextInput
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Enter a prompt..."
        style={styles.input}
        multiline
      />

      <TouchableOpacity
        onPress={handleGenerate}
        disabled={isLoading}
        style={styles.button}
      >
        <ThemedText>{isLoading ? "Generating..." : "Generate"}</ThemedText>
      </TouchableOpacity>

      {result && (
        <View style={styles.result}>
          <ThemedText type="defaultSemiBold">Result:</ThemedText>
          <ThemedText>{result}</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

/**
 * Example 3: AI-Powered Form Assistant
 */
export function FormAssistantExample() {
  const [topic, setTopic] = useState("");
  const { complete, isLoading } = useTamboCompletion();

  const generateSuggestions = async () => {
    const prompt = `Generate 5 creative suggestions for: ${topic}`;
    const suggestions = await complete(prompt);
    console.log(suggestions);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Form Assistant</ThemedText>

      <TextInput
        value={topic}
        onChangeText={setTopic}
        placeholder="What do you need suggestions for?"
        style={styles.input}
      />

      <TouchableOpacity
        onPress={generateSuggestions}
        disabled={isLoading}
        style={styles.button}
      >
        <ThemedText>
          {isLoading ? "Thinking..." : "Get AI Suggestions"}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

/**
 * Example 4: Quick AI Helper
 * Single-purpose component for specific AI tasks
 */
export function QuickAIHelper({
  onResult,
}: {
  onResult: (text: string) => void;
}) {
  const { complete, isLoading } = useTamboCompletion();

  const improveText = async (text: string) => {
    const improved = await complete(`Improve this text: ${text}`);
    onResult(improved);
  };

  const summarize = async (text: string) => {
    const summary = await complete(`Summarize this: ${text}`);
    onResult(summary);
  };

  const translate = async (text: string, language: string) => {
    const translated = await complete(`Translate to ${language}: ${text}`);
    onResult(translated);
  };

  return {
    improveText,
    summarize,
    translate,
    isLoading,
  };
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  result: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    gap: 8,
  },
});
