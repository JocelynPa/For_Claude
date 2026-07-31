import SwiftUI

struct VehicleHeroCard: View {
    let vehicle: Vehicle

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(vehicle.model.uppercased())
                            .font(AppFont.overline())
                            .foregroundStyle(AppTheme.Colors.accent)
                            .tracking(1.2)
                        Text(vehicle.displayName)
                            .font(AppFont.title())
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

                VehiclePortrait(imageUrl: vehicle.imageUrl)

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

/// The real vehicle render from Tesla's own image compositor (model, paint,
/// wheels — see backend/src/services/teslaVehicleImage.ts), on a soft
/// "spotlight" backdrop rather than a flat background. Falls back to a
/// generic glyph while loading, on failure, or when no image URL is
/// available (car type unsupported by the compositor, e.g. Cybertruck).
private struct VehiclePortrait: View {
    let imageUrl: URL?

    var body: some View {
        ZStack {
            RadialGradient(
                colors: [AppTheme.Colors.accent.opacity(0.16), .clear],
                center: .center,
                startRadius: 10,
                endRadius: 170
            )

            if let imageUrl {
                AsyncImage(url: imageUrl) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().scaledToFit()
                    case .failure:
                        fallbackGlyph
                    default:
                        ProgressView().tint(AppTheme.Colors.accent)
                    }
                }
            } else {
                fallbackGlyph
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: 190)
    }

    private var fallbackGlyph: some View {
        Image(systemName: "car.side.fill")
            .font(.system(size: 60))
            .foregroundStyle(AppTheme.Colors.textSecondary)
    }
}
