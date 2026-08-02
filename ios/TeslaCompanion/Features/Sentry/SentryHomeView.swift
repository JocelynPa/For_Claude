import SwiftUI

struct SentryHomeView: View {
    @EnvironmentObject private var environment: AppEnvironment
    @State private var vehicle: Vehicle?
    @State private var events: [SentryTimelineEntry] = []
    @State private var isLoading = true
    @State private var isTogglingSentry = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: AppSpacing.lg) {
                    if let vehicle {
                        VehicleIdentityHeader(vehicle: vehicle)
                        SentryStatusBanner(isActive: sentryModeBinding.wrappedValue)
                        Toggle("Activer Sentinel", isOn: sentryModeBinding)
                            .tint(AppTheme.Colors.accent)
                            .disabled(isTogglingSentry)
                            .padding(.horizontal, AppSpacing.xs)
                    }

                    VStack(alignment: .leading, spacing: AppSpacing.md) {
                        HStack {
                            SectionHeader(title: "Événements")
                            if events.contains(where: { $0.isNew }) {
                                Spacer()
                                Button("Tout marquer comme lu") {
                                    Task { await markAllSeen() }
                                }
                                .font(AppFont.caption())
                                .foregroundStyle(AppTheme.Colors.accent)
                            }
                        }

                        if isLoading {
                            ProgressView().frame(maxWidth: .infinity).padding(.vertical, AppSpacing.lg)
                        } else if events.isEmpty {
                            Text("Aucun événement Sentry pour le moment.")
                                .font(AppFont.body())
                                .foregroundStyle(AppTheme.Colors.textSecondary)
                        } else {
                            if events.contains(where: { $0.batteryLevelPercent != nil }) {
                                Text("La conso affichée est celle du véhicule pendant la session, pas uniquement celle de Sentinel (dérive naturelle à l'arrêt incluse).")
                                    .font(AppFont.caption())
                                    .foregroundStyle(AppTheme.Colors.textSecondary)
                            }
                            EventTimelineView(events: events)
                        }
                    }
                }
                .padding(AppSpacing.md)
            }
            .background(AppTheme.Colors.background)
            .navigationTitle("Sentinel")
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private func load() async {
        isLoading = true
        // Only overwrite `vehicle` on a successful, non-empty fetch — a
        // transient failure on pull-to-refresh (e.g. car asleep, brief Fleet
        // API hiccup) shouldn't blank out the header/toggle that was already
        // showing.
        if let fetched = try? await environment.vehicleService.fetchVehicles().first {
            vehicle = fetched
        }
        guard let vehicleId = vehicle?.id else {
            isLoading = false
            return
        }
        // Same reasoning as `vehicle` above: a failed refresh shouldn't wipe
        // an already-populated events list.
        if let fetched = try? await environment.sentryService.fetchEvents(vehicleId: vehicleId) {
            events = fetched
        }
        isLoading = false
    }

    private func markAllSeen() async {
        guard let vehicleId = vehicle?.id else { return }
        try? await environment.sentryService.markAllSeen(vehicleId: vehicleId)
        events = events.map { var event = $0; event.isNew = false; return event }
    }

    private var sentryModeBinding: Binding<Bool> {
        Binding(
            get: { vehicle?.isSentryModeActive ?? false },
            set: { newValue in Task { await setSentryMode(newValue) } }
        )
    }

    private func setSentryMode(_ on: Bool) async {
        guard let vehicleId = vehicle?.id else { return }
        isTogglingSentry = true
        defer { isTogglingSentry = false }
        if (try? await environment.vehicleService.setSentryMode(vehicleId, on: on)) != nil {
            vehicle?.isSentryModeActive = on
        }
    }
}

/// Small identification header — this app now only ever shows one vehicle's
/// Sentry status, but a thumbnail + name still makes it clear which car
/// that is at a glance, without the full control card the Dashboard used to
/// have.
private struct VehicleIdentityHeader: View {
    let vehicle: Vehicle

    var body: some View {
        HStack(spacing: AppSpacing.sm) {
            ZStack {
                RadialGradient(
                    colors: [AppTheme.Colors.accent.opacity(0.16), .clear],
                    center: .center,
                    startRadius: 4,
                    endRadius: 40
                )
                if let imageUrl = vehicle.imageUrl {
                    AsyncImage(url: imageUrl) { phase in
                        if case .success(let image) = phase {
                            image.resizable().scaledToFit()
                        } else {
                            Image(systemName: "car.side.fill")
                                .foregroundStyle(AppTheme.Colors.textSecondary)
                        }
                    }
                } else {
                    Image(systemName: "car.side.fill")
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                }
            }
            .frame(width: 56, height: 56)

            VStack(alignment: .leading, spacing: 2) {
                Text(vehicle.displayName)
                    .font(AppFont.headline())
                    .foregroundStyle(AppTheme.Colors.textPrimary)
                Text(vehicle.vin.suffix(6).uppercased())
                    .font(AppFont.caption())
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }
            Spacer()
        }
    }
}
