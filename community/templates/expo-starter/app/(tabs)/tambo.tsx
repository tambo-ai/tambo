/**
 * Tambo AI Demo Screen
 *
 * This screen demonstrates the integration of Tambo AI in your Expo app.
 */

import { TamboChat } from "@/components/tambo-chat";
import { StyleSheet, View } from "react-native";

export default function TamboScreen() {
  return (
    <View style={styles.container}>
      <TamboChat />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
