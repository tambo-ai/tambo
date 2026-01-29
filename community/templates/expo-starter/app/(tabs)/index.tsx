import { Image } from "expo-image";
import { Platform, StyleSheet } from "react-native";

import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Tambo AI Starter! 🤖</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Set up your API Key</ThemedText>
        <ThemedText>
          Create a <ThemedText type="defaultSemiBold">.env</ThemedText> file in
          the root directory and add:
        </ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.code}>
          EXPO_PUBLIC_TAMBO_API_KEY=your-key-here
        </ThemedText>
        <ThemedText>
          Get your API key from{" "}
          <ThemedText type="defaultSemiBold">tambo.ai/dashboard</ThemedText>
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Try Tambo AI Chat</ThemedText>
        <ThemedText>
          Tap the <ThemedText type="defaultSemiBold">Tambo AI</ThemedText> tab
          to start chatting with AI. The chat interface is pre-built and ready
          to use!
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Customize & Build</ThemedText>
        <ThemedText>
          Edit{" "}
          <ThemedText type="defaultSemiBold">
            components/tambo-chat.tsx
          </ThemedText>{" "}
          to customize the chat UI. Check{" "}
          <ThemedText type="defaultSemiBold">TAMBO_README.md</ThemedText> for
          complete documentation.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  code: {
    fontFamily: Platform.select({
      ios: "Courier",
      android: "monospace",
      default: "monospace",
    }),
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    padding: 8,
    borderRadius: 4,
  },
});
