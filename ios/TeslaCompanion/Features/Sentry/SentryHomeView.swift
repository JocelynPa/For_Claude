import Foundation
import SwiftUI

struct SentryHomeView: View {
    @EnvironmentObject private var environment: AppEnvironment
    @State private var vehicle: Vehicle?
    @State private var events: [SentryTimelineEntry] = []
    @State private var isLoading = true
    @State private var isTogglingSentry = false
    @State private var loadError: String?
    @State private var loadTask: Task<Void, Never>?

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

                    if let loadError {
                        Text("Échec de l'actualisation : \(loadError)")
                            .font(AppFont.caption())
                            .foregroundStyle(AppTheme.Colors.danger)
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

                        if isLoading && events.isEmpty {
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
            .task { await runLoad() }
            .refreshable { await runLoad() }
        }
    }

    /// `.task` (on first appear) and `.refreshable` (on pull-to-refresh)
    /// both call this. Without coordination, a pull-to-refresh right after
    /// launch races the initial `.task` load — same endpoint, two in-flight
    /// requests — and whichever loses the race can surface as a confusing
    /// "cancelled" error. Cancelling any previous load before starting a new
    /// one makes that explicit and expected instead.
    private func runLoad() async {
        loadTask?.cancel()
        let task = Task { await load() }
        loadTask = task
        await task.value
    }

    private func load() async {
        isLoading = true
        loadError = nil
        // Only overwrite `vehicle` on a successful fetch — a transient
        // failure on pull-to-refresh (e.g. car asleep, brief Fleet API
        // hiccup) shouldn't blank out the header/toggle that was already
        // showing. Errors are surfaced (not swallowed) so a refresh that
        // silently fails doesn't just look like nothing happened — except
        // cancellation, which just means a newer load superseded this one.
        do {
            if let fetched = try await environment.vehicleService.fetchVehicles().first {
                vehicle = fetched
            }
        } catch {
            if !Self.isCancellation(error) { loadError = error.localizedDescription }
        }
        guard let vehicleId = vehicle?.id, !Task.isCancelled else {
            isLoading = false
            return
        }
        // Same reasoning as `vehicle` above: a failed refresh shouldn't wipe
        // an already-populated events list.
        do {
            events = try await environment.sentryService.fetchEvents(vehicleId: vehicleId)
        } catch {
            if !Self.isCancellation(error) { loadError = error.localizedDescription }
        }
        isLoading = false
    }

    private static func isCancellation(_ error: Error) -> Bool {
        error is CancellationError || (error as? URLError)?.code == .cancelled
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
