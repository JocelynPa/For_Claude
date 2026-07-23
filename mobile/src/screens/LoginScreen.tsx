import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { exchangeTeslaAuthCode, getTeslaAuthorizeUrl, pollTeslaSession } from "@/api/auth";
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
      // redirection transmet le code au backend elle-même, car
      // expo-web-browser n'intercepte pas cette redirection de façon fiable
      // partout : ça ne marche jamais dans Expo Go, mais ça peut marcher
      // dans un vrai build natif — dans ce cas le navigateur se ferme avant
      // même que la page statique ait pu s'exécuter. On gère donc les deux
      // cas : si l'interception a fourni un code, on l'échange nous-mêmes ;
      // sinon on retombe sur le polling en attendant la page statique.
      const redirectUri = process.env.EXPO_PUBLIC_TESLA_REDIRECT_URI ?? "";
      const state = Math.random().toString(36).slice(2);
      const authUrl = getTeslaAuthorizeUrl(redirectUri, state);

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      let session = null;
      if (result.type === "success" && result.url) {
        const code = new URL(result.url).searchParams.get("code");
        if (code) {
          try {
            session = await exchangeTeslaAuthCode(code, state);
          } catch {
            // Le code a peut-être déjà été consommé par la page statique en
            // parallèle (à usage unique) — on retombe sur le polling.
          }
        }
      }

      if (!session) {
        session = await pollTeslaSession(state);
      }

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
