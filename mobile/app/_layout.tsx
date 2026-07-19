import { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { RevenueCatProvider } from "@/purchases/RevenueCatProvider";

function RootNavigation() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const inTabsGroup = segments[0] === "(tabs)";

    if (!isAuthenticated && inTabsGroup) {
      router.replace("/login");
    } else if (isAuthenticated && !inTabsGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="paywall" options={{ presentation: "modal", headerShown: true }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RevenueCatProvider>
        <StatusBar style="auto" />
        <RootNavigation />
      </RevenueCatProvider>
    </AuthProvider>
  );
}
