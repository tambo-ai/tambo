import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { TamboProvider } from "@tambo-ai/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { tools } from "../lib/tools";
import { initialMessages } from "../lib/system-prompt";

const TAMBO_API_KEY = process.env.EXPO_PUBLIC_TAMBO_API_KEY ?? "";
const USER_KEY_STORAGE = "mobile-log-user-key";

export default function RootLayout() {
  const [userKey, setUserKey] = useState<string | null>(null);

  useEffect(() => {
    async function getOrCreateUserKey() {
      let key = await AsyncStorage.getItem(USER_KEY_STORAGE);
      if (!key) {
        key = crypto.randomUUID();
        await AsyncStorage.setItem(USER_KEY_STORAGE, key);
      }
      setUserKey(key);
    }
    void getOrCreateUserKey();
  }, []);

  if (!userKey) return null;

  return (
    <TamboProvider
      apiKey={TAMBO_API_KEY}
      userKey={userKey}
      tools={tools}
      initialMessages={initialMessages}
    >
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#fff" },
          headerTintColor: "#1a1a1a",
          headerTitleStyle: { fontWeight: "600" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Logs" }} />
        <Stack.Screen
          name="log/[id]"
          options={{ title: "Log", headerBackTitle: "Logs" }}
        />
      </Stack>
    </TamboProvider>
  );
}
