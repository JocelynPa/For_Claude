import { useState } from "react";
import { ActivityIndicator, Alert, Button, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { getTeslaAuthorizeUrl, pollTeslaSession } from "@/api/auth";
import { useAuth } from "@/auth/AuthContext";

export function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { refresh } = useAuth();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Tesla n'accepte que des redirect_uri HTTPS enregistrées à l'avance
      // dans le Developer Portal (pas de schéma custom type teslacompanion://
      // ni d'URL exp:// dynamique d'Expo Go). La page statique qui reçoit la
      // redirection (GitHub Pages) transmet le code au backend elle-même —
      // expo-web-browser n'intercepte pas cette redirection de façon fiable,
      // donc on ne dépend pas de son résultat : dès que le navigateur se
      // ferme (peu importe comment), on interroge le backend avec `state`
      // jusqu'à ce que l'échange soit terminé.
      const redirectUri = process.env.EXPO_PUBLIC_TESLA_REDIRECT_URI ?? "";
      const state = Math.random().toString(36).slice(2);
      const authUrl = getTeslaAuthorizeUrl(redirectUri, state);

      await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      const session = await pollTeslaSession(state);
      if (!session) {
        throw new Error("La connexion a expiré, réessaie.");
      }
      await refresh();
    } catch (error) {
      Alert.alert("Connexion impossible", (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tesla Companion</Text>
      <Text style={styles.subtitle}>
        Connecte-toi avec ton compte Tesla pour piloter ton véhicule et suivre tes trajets.
      </Text>
      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Se connecter avec Tesla" onPress={handleLogin} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { textAlign: "center", color: "#777", marginBottom: 24 },
});
