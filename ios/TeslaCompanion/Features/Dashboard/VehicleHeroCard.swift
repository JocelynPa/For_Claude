import SwiftUI

struct VehicleHeroCard: View {
    let vehicle: Vehicle

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(vehicle.model)
                            .font(AppFont.headline())
                            .foregroundStyle(AppTheme.Colors.textPrimary)
                        Text(vehicle.vin.suffix(6).uppercased())
                            .font(AppFont.caption())
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                    }
                    Spacer()
                    PillBadge(
                        text: vehicle.state == .online ? "En ligne" : "Hors ligne",
                        style: vehicle.state == .online ? .success : .neutral
                    )
                }

                Image(systemName: "car.side.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(AppTheme.Colors.textPrimary.opacity(0.85))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, AppSpacing.md)

                HStack(spacing: AppSpacing.lg) {
                    StatTile(value: "\(vehicle.battery.batteryLevel)%", label: "Batterie", icon: "battery.75")
                    StatTile(value: "\(Int(vehicle.battery.rangeKm)) km", label: "Autonomie", icon: "gauge.with.needle")
                    StatTile(
                        value: vehicle.isLocked ? "Verrouillé" : "Déverrouillé",
                        label: "État",
                        icon: vehicle.isLocked ? "lock.fill" : "lock.open.fill"
                    )
                }
            }
        }
    }
}
