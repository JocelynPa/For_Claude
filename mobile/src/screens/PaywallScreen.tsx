import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import { router } from "expo-router";
import { usePurchases } from "@/purchases/RevenueCatProvider";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors, spacing, typography } from "@/theme/tokens";

const FEATURES = [
  { icon: "lock-open-outline" as const, label: "Contrôle à distance illimité" },
  { icon: "stats-chart-outline" as const, label: "Statistiques de conduite détaillées" },
  { icon: "notifications-outline" as const, label: "Alertes véhicule en temps réel" },
];

export function PaywallScreen() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const { refresh } = usePurchases();

  useEffect(() => {
    Purchases.getOfferings()
      .then((offerings) => setPackages(offerings.current?.availablePackages ?? []))
      .catch((error) => Alert.alert("Erreur", error.message))
      .finally(() => setIsLoading(false));
  }, []);

  const purchase = async (pkg: PurchasesPackage) => {
    setPurchasingId(pkg.identifier);
    try {
      await Purchases.purchasePackage(pkg);
      await refresh();
      router.back();
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert("Achat impossible", error.message);
      }
    } finally {
      setPurchasingId(null);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Passer en premium</Text>
      <Text style={styles.subtitle}>Débloque toutes les fonctionnalités de Tesla Companion.</Text>

      <View style={styles.features}>
        {FEATURES.map((feature) => (
          <View key={feature.label} style={styles.featureRow}>
            <Ionicons name={feature.icon} size={18} color={colors.accent} />
            <Text style={styles.featureLabel}>{feature.label}</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={packages}
        keyExtractor={(item) => item.identifier}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.packageCard}>
            <View style={styles.packageInfo}>
              <Text style={styles.packageTitle}>{item.product.title}</Text>
              <Text style={styles.packagePrice}>{item.product.priceString}</Text>
            </View>
            <PrimaryButton
              label="Choisir"
              busy={purchasingId === item.identifier}
              onPress={() => purchase(item)}
            />
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.xl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  title: { color: colors.textPrimary, ...typography.largeTitle },
  subtitle: { color: colors.textSecondary, ...typography.body },
  features: { gap: spacing.md },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  featureLabel: { color: colors.textPrimary, ...typography.body },
  list: { gap: spacing.md, marginTop: spacing.sm },
  packageCard: { gap: spacing.lg },
  packageInfo: { gap: spacing.xs },
  packageTitle: { color: colors.textPrimary, ...typography.headline },
  packagePrice: { color: colors.textSecondary, ...typography.body },
});
