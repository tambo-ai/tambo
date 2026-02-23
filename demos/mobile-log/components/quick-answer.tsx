import { View, Text, Pressable, StyleSheet } from "react-native";

interface QuickAnswerProps {
  question: string;
  options: string[];
  selectedOption?: string;
  onSelect: (option: string) => void;
}

export function QuickAnswer({
  question,
  options,
  selectedOption,
  onSelect,
}: QuickAnswerProps) {
  const isAnswered = selectedOption !== undefined;

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.optionsContainer}>
        {options.map((opt) => (
          <Pressable
            key={opt}
            disabled={isAnswered}
            onPress={() => onSelect(opt)}
            style={[
              styles.option,
              isAnswered && opt === selectedOption && styles.selectedOption,
              isAnswered && opt !== selectedOption && styles.dimmedOption,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                isAnswered &&
                  opt === selectedOption &&
                  styles.selectedOptionText,
                isAnswered && opt !== selectedOption && styles.dimmedOptionText,
              ]}
            >
              {opt}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  question: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedOption: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  dimmedOption: {
    opacity: 0.4,
  },
  optionText: {
    fontSize: 14,
    color: "#1a1a1a",
  },
  selectedOptionText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  dimmedOptionText: {
    color: "#666",
  },
});
