import CoreLocation
import SwiftUI
import WeatherKit

/// Replaces the old vehicle-icon header + separate status banner + plain
/// toggle with a single hero card: a pulsing orb (echoes the app icon's
/// radar motif) as the live status indicator, and a full-width capsule as
/// the activation control — no generic car glyph anywhere.
struct SentinelActivationCard: View {
    let vehicle: Vehicle
    let isActive: Bool
    let isToggling: Bool
    let onToggle: () -> Void

    private var tint: Color { isActive ? AppTheme.Colors.danger : AppTheme.Colors.accent }

    var body: some View {
        Card(padding: AppSpacing.lg) {
            VStack(spacing: AppSpacing.lg) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(vehicle.displayName)
                            .font(AppFont.headline())
                            .foregroundStyle(AppTheme.Colors.textPrimary)
                        Text(vehicle.vin.uppercased())
                            .font(AppFont.caption())
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                    }
                    Spacer(minLength: AppSpacing.sm)
                    WeatherChip(location: vehicle.location)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                orb

                VStack(spacing: 2) {
                    Text(isActive ? "Sentinel actif" : "Sentinel inactif")
                        .font(AppFont.title())
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    Text(isActive ? "Le véhicule surveille ses abords" : "La surveillance est désactivée")
                        .font(AppFont.caption())
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                }

                toggleButton
            }
        }
    }

    private var orb: some View {
        ZStack {
            RadialGradient(colors: [tint.opacity(0.22), .clear], center: .center, startRadius: 4, endRadius: 90)

            SentinelPulseRings(isActive: isActive, tint: tint)

            Circle()
                .fill(
                    RadialGradient(
                        colors: [tint.opacity(0.9), tint.opacity(0.55)],
                        center: .center,
                        startRadius: 0,
                        endRadius: 40
                    )
                )
                .frame(width: 76, height: 76)
                .overlay(Circle().stroke(tint.opacity(0.5), lineWidth: 1))

            Image(systemName: isActive ? "eye.fill" : "moon.zzz.fill")
                .font(.system(size: 26, weight: .semibold))
                .foregroundStyle(AppTheme.Colors.textPrimary)
        }
        .frame(width: 180, height: 180)
    }

    private var toggleButton: some View {
        Button(action: onToggle) {
            HStack(spacing: AppSpacing.sm) {
                if isToggling {
                    ProgressView()
                        .tint(isActive ? AppTheme.Colors.textPrimary : AppTheme.Colors.background)
                } else {
                    Image(systemName: isActive ? "stop.fill" : "power")
                }
                Text(isActive ? "Désactiver Sentinel" : "Activer Sentinel")
                    .fontWeight(.semibold)
            }
            .font(AppFont.body())
            .foregroundStyle(isActive ? AppTheme.Colors.textPrimary : AppTheme.Colors.background)
            .frame(maxWidth: .infinity)
            .padding(.vertical, AppSpacing.sm + 2)
            .background(isActive ? AppTheme.Colors.surface : AppTheme.Colors.accent)
            .clipShape(Capsule())
            .overlay(
                Capsule().stroke(isActive ? tint.opacity(0.5) : .clear, lineWidth: 1)
            )
        }
        .disabled(isToggling)
    }
}

/// Fetches and shows the vehicle's current on-site weather via WeatherKit.
/// `location` comes straight from the live Fleet API response (see
/// Vehicle.location) — never persisted, and re-fetched whenever it changes.
private struct WeatherChip: View {
    let location: Coordinate?
    @State private var current: CurrentWeather?

    var body: some View {
        Group {
            if let current {
                HStack(spacing: 4) {
                    Image(systemName: current.symbolName)
                        .symbolRenderingMode(.multicolor)
                    Text(current.temperature.formatted(.measurement(width: .narrow, numberFormatStyle: .number.precision(.fractionLength(0)))))
                }
                .font(AppFont.caption())
                .foregroundStyle(AppTheme.Colors.textSecondary)
            }
        }
        .task(id: location) {
            await load()
        }
    }

    private func load() async {
        guard let location else {
            print("WeatherChip: no vehicle location, skipping WeatherKit lookup")
            current = nil
            return
        }
        do {
            current = try await WeatherService.shared.weather(
                for: CLLocation(latitude: location.latitude, longitude: location.longitude),
                including: .current
            )
        } catch {
            // Swallowed on purpose (no location = no chip, not an error
            // banner) but logged — WeatherKit failures (missing
            // entitlement, capability not enabled for the App ID, no
            // WeatherKit usage in the provisioning profile) are otherwise
            // invisible since there's no backend to relay them through.
            print("WeatherChip: WeatherKit lookup failed —", error)
            current = nil
        }
    }
}

/// Three rings pulsing outward from the orb while active — always present
/// in the hierarchy (just hidden via opacity when inactive) so the looping
/// animation can be restarted cleanly from scratch each time Sentinel turns
/// back on, rather than fighting SwiftUI over a freshly-inserted view.
private struct SentinelPulseRings: View {
    let isActive: Bool
    let tint: Color
    @State private var animate = false

    var body: some View {
        ZStack {
            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .stroke(tint, lineWidth: 2)
                    .frame(width: animate ? 170 : 76, height: animate ? 170 : 76)
                    .opacity(animate ? 0 : 0.7)
                    .animation(
                        .easeOut(duration: 1.8).repeatForever(autoreverses: false).delay(Double(index) * 0.5),
                        value: animate
                    )
            }
        }
        .opacity(isActive ? 1 : 0)
        .onAppear { if isActive { animate = true } }
        .onChange(of: isActive) { _, newValue in
            guard newValue else { return }
            animate = false
            DispatchQueue.main.async { animate = true }
        }
    }
}
