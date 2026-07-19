import { createContext, useContext, useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import { Platform } from "react-native";
import Purchases, { type CustomerInfo } from "react-native-purchases";

const PREMIUM_ENTITLEMENT_ID = "premium";

interface PurchasesContextValue {
  customerInfo: CustomerInfo | null;
  isPremium: boolean;
  refresh: () => Promise<void>;
}

const PurchasesContext = createContext<PurchasesContextValue>({
  customerInfo: null,
  isPremium: false,
  refresh: async () => undefined,
});

export function RevenueCatProvider({ children }: PropsWithChildren) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  useEffect(() => {
    const apiKey = Platform.select({
      ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
      android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
    });

    if (!apiKey) {
      console.warn("Clé RevenueCat manquante pour cette plateforme.");
      return;
    }

    Purchases.configure({ apiKey });
    const listener = (info: CustomerInfo) => setCustomerInfo(info);
    Purchases.addCustomerInfoUpdateListener(listener);
    Purchases.getCustomerInfo().then(setCustomerInfo).catch(console.error);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  const refresh = async () => {
    const info = await Purchases.getCustomerInfo();
    setCustomerInfo(info);
  };

  const isPremium = Boolean(
    customerInfo?.entitlements.active[PREMIUM_ENTITLEMENT_ID]
  );

  return (
    <PurchasesContext.Provider value={{ customerInfo, isPremium, refresh }}>
      {children}
    </PurchasesContext.Provider>
  );
}

export function usePurchases(): PurchasesContextValue {
  return useContext(PurchasesContext);
}

/** Associe l'utilisateur RevenueCat à notre propre identifiant utilisateur backend. */
export async function identifyRevenueCatUser(appUserId: string): Promise<void> {
  await Purchases.logIn(appUserId);
}
