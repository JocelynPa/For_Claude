import { Alert, Button, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { logout } from "@/api/auth";
import { useAuth } from "@/auth/AuthContext";
import { usePurchases } from "@/purchases/RevenueCatProvider";

export function SettingsScreen() {
  const { signOut } = useAuth();
  const { isPremium } = usePurchases();

  const handleLogout = async () => {
    try {
      await logout();
      await signOut();
    } catch {
      Alert.alert("Erreur", "La déconnexion a échoué.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        Abonnement : {isPremium ? "Premium actif" : "Compte gratuit"}
      </Text>
      {!isPremium && <Button title="Voir les offres premium" onPress={() => router.push("/paywall")} />}
      <Button title="Se déconnecter" color="#c0392b" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 16, justifyContent: "center" },
  status: { fontSize: 16, textAlign: "center", marginBottom: 8 },
});
