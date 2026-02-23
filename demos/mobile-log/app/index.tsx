import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTamboThreadList } from "@tambo-ai/react";

export default function LogListScreen() {
  const router = useRouter();
  const { data, isLoading, refetch } = useTamboThreadList({ limit: 50 });

  function handleNewLog() {
    router.push("/log/new");
  }

  function handleSelectLog(threadId: string) {
    router.push(`/log/${threadId}`);
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#2563eb" />
      ) : (
        <FlatList
          data={data?.threads ?? []}
          keyExtractor={(item) => item.id}
          onRefresh={() => void refetch()}
          refreshing={isLoading}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No logs yet</Text>
              <Text style={styles.emptySubtext}>
                Tap + to start your first log
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelectLog(item.id)}
              style={styles.threadRow}
            >
              <Text style={styles.threadName} numberOfLines={1}>
                {item.name ?? "Untitled Log"}
              </Text>
              <Text style={styles.threadDate}>
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString()
                  : ""}
              </Text>
            </Pressable>
          )}
        />
      )}

      <Pressable onPress={handleNewLog} style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loader: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  threadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  threadName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#1a1a1a",
    marginRight: 12,
  },
  threadDate: {
    fontSize: 13,
    color: "#999",
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "300",
    marginTop: -2,
  },
});
