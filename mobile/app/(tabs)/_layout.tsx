import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="index" options={{ title: "Véhicule" }} />
      <Tabs.Screen name="stats" options={{ title: "Statistiques" }} />
      <Tabs.Screen name="settings" options={{ title: "Réglages" }} />
    </Tabs>
  );
}
