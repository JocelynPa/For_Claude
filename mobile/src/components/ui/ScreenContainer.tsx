import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View, type ScrollViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "@/theme/tokens";

interface Props extends PropsWithChildren {
  scroll?: boolean;
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
}

export function ScreenContainer({ children, scroll = true, contentContainerStyle }: Props) {
  const insets = useSafeAreaInsets();

  if (!scroll) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <View style={styles.padded}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.padded,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl },
        contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  padded: { paddingHorizontal: spacing.xl, gap: spacing.xl },
});
