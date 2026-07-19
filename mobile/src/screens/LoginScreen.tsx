import { useState } from "react";
import { ActivityIndicator, Alert, Button, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { exchangeTeslaAuthCode, getTeslaAuthorizeUrl } from "@/api/auth";
import { useAuth } from "@/auth/AuthContext";

export function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { refresh } = useAuth();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const redirectUri = Linking.createURL("auth/callback");
      const authUrl = getTeslaAuthorizeUrl(redirectUri);
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === "success" && result.url) {
        const code = new URL(result.url).searchParams.get("code");
        if (!code) throw new Error("Code d'autorisation manquant");
        await exchangeTeslaAuthCode(code, redirectUri);
        await refresh();
      }
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
