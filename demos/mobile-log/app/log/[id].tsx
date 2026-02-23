import { useEffect } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTambo } from "@tambo-ai/react";
import { LogEntry } from "../../components/log-entry";
import { InputBar } from "../../components/input-bar";

export default function LogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { messages, switchThread, startNewThread } = useTambo();

  useEffect(() => {
    if (id === "new") {
      startNewThread();
    } else if (id) {
      switchThread(id);
    }
  }, [id, switchThread, startNewThread]);

  // Filter out system messages and reverse so newest is first (inverted FlatList)
  const displayMessages = messages
    .filter((m) => m.role !== "system")
    .toReversed();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={displayMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <LogEntry message={item} />}
        inverted
        contentContainerStyle={styles.messageList}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 100,
        }}
      />
      <InputBar />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  messageList: {
    paddingVertical: 8,
  },
});
