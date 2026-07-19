import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import { router } from "expo-router";
import { usePurchases } from "@/purchases/RevenueCatProvider";
import { CommandButton } from "@/screens/components/CommandButton";

export function PaywallScreen() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const { refresh } = usePurchases();

  useEffect(() => {
    Purchases.getOfferings()
      .then((offerings) => {
        setPackages(offerings.current?.availablePackages ?? []);
      })
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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Passer en premium</Text>
      <Text style={styles.subtitle}>
        Contrôle à distance illimité, statistiques de conduite détaillées et alertes.
      </Text>
      <FlatList
        data={packages}
        keyExtractor={(item) => item.identifier}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CommandButton
            label={`${item.product.title} — ${item.product.priceString}`}
            busy={purchasingId === item.identifier}
            onPress={() => purchase(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { color: "#777" },
  list: { gap: 12, marginTop: 8 },
});
