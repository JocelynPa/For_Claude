import { View, StyleSheet } from "react-native";
import Svg, { Circle, Defs, Rect, RadialGradient, Stop } from "react-native-svg";
import { colors } from "@/theme/tokens";

/**
 * Silhouette générique et abstraite (pas un rendu du véhicule Tesla réel,
 * pour éviter tout problème de droits sur son design déposé).
 */
export function VehicleIllustration() {
  return (
    <View style={styles.container}>
      <Svg width="100%" height={140} viewBox="0 0 300 150">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="55%" r="60%">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.25} />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Circle cx="150" cy="90" r="110" fill="url(#glow)" />

        {/* Roues */}
        <Circle cx="85" cy="120" r="22" fill={colors.background} stroke={colors.border} strokeWidth={3} />
        <Circle cx="215" cy="120" r="22" fill={colors.background} stroke={colors.border} strokeWidth={3} />

        {/* Carrosserie */}
        <Rect x="20" y="75" width="260" height="45" rx="20" fill={colors.surfaceElevated} />
        {/* Habitacle */}
        <Rect x="90" y="38" width="120" height="42" rx="18" fill={colors.surfaceElevated} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
});
