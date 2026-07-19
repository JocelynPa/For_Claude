import { Link } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

export function PaywallBanner({ reason }: { reason: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{reason}</Text>
      <Link href="/paywall" asChild>
        <Button title="Voir les offres" />
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  text: { textAlign: "center", color: "#555" },
});
