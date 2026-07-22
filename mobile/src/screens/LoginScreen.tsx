import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { getTeslaAuthorizeUrl, pollTeslaSession } from "@/api/auth";
import { useAuth } from "@/auth/AuthContext";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors, spacing, typography } from "@/theme/tokens";

export function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { refresh } = useAuth();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Tesla n'accepte que des redirect_uri HTTPS enregistrées à l'avance
      // dans le Developer Portal (pas de schéma custom type teslacompanion://
      // ni d'URL exp:// dynamique d'Expo Go). La page statique qui reçoit la
      // redirection transmet le code au backend elle-même — expo-web-browser
      // n'intercepte pas cette redirection de façon fiable, donc on ne
      // dépend pas de son résultat : dès que le navigateur se ferme (peu
      // importe comment), on interroge le backend avec `state` jusqu'à ce
      // que l'échange soit terminé.
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
      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <Ionicons name="flash" size={28} color={colors.background} />
        </View>
        <Text style={styles.title}>Tesla Companion</Text>
        <Text style={styles.subtitle}>
          Contrôle ton véhicule et suis tes trajets, où que tu sois.
        </Text>
      </View>

      <View style={styles.footer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.textPrimary} />
        ) : (
          <PrimaryButton label="Se connecter avec Tesla" onPress={handleLogin} icon="car-sport" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "space-between",
    padding: spacing.xxxl,
    paddingBottom: spacing.xxxl * 1.5,
  },
  hero: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.lg },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: { color: colors.textPrimary, ...typography.largeTitle },
  subtitle: {
    color: colors.textSecondary,
    ...typography.body,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  footer: { gap: spacing.md },
});
