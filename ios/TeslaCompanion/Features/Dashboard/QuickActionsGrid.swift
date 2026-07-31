import SwiftUI

struct QuickActionButton: View {
    let title: String
    let icon: String
    var isActive: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: AppSpacing.xs) {
                Image(systemName: icon)
                    .font(.system(size: 20, weight: .semibold))
                Text(title)
                    .font(AppFont.caption())
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, AppSpacing.md)
            .foregroundStyle(isActive ? AppTheme.Colors.background : AppTheme.Colors.textPrimary)
            .background(isActive ? AppTheme.Colors.accent : AppTheme.Colors.surfaceElevated)
            .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
                    .stroke(isActive ? .clear : AppTheme.Colors.hairline, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

struct QuickActionsGrid: View {
    let vehicle: Vehicle
    let onLockToggle: () -> Void
    let onClimate: () -> Void
    let onFlash: () -> Void
    let onHonk: () -> Void

    private let columns = [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())]

    var body: some View {
        LazyVGrid(columns: columns, spacing: AppSpacing.sm) {
            QuickActionButton(
                title: vehicle.isLocked ? "Déverr." : "Verrouiller",
                icon: vehicle.isLocked ? "lock.open.fill" : "lock.fill",
                action: onLockToggle
            )
            QuickActionButton(title: "Climat.", icon: "fan.fill", isActive: vehicle.climate.isOn, action: onClimate)
            QuickActionButton(title: "Phares", icon: "light.beacon.max.fill", action: onFlash)
            QuickActionButton(title: "Klaxon", icon: "horn.fill", action: onHonk)
        }
    }
}
