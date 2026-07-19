import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

interface Props {
  label: string;
  busy?: boolean;
  onPress: () => void;
}

export function CommandButton({ label, busy, onPress }: Props) {
  return (
    <Pressable style={styles.button} onPress={onPress} disabled={busy}>
      {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  label: { color: "#fff", fontWeight: "600" },
});
