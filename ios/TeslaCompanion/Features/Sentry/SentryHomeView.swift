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
    // Tesla's wake_up + poll cycle (fetchVehicleDataWithWake on the backend)
    // can take up to ~30s when the car is asleep. A bare spinner for that
    // long reads as broken, so this flips on after a few seconds to explain
    // the wait instead of leaving it unexplained.
    @State private var isWakingVehicle = false
    @State private var wakeHintTask: Task<Void, Never>?
    @State private var eventsLocked = false
    @State private var showPaywall = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: AppSpacing.lg) {
                    if let vehicle {
                        SentinelActivationCard(
                            vehicle: vehicle,
                            isActive: vehicle.isSentryModeActive,
                            isToggling: isTogglingSentry,
                            onToggle: { Task { await setSentryMode(!vehicle.isSentryModeActive) } }
                        )
                    } else if isLoading {
                        VStack(spacing: AppSpacing.sm) {
                            ProgressView()
                            if isWakingVehicle {
                                Text("Réveil du véhicule en cours…")
                                    .font(AppFont.caption())
                                    .foregroundStyle(AppTheme.Colors.textSecondary)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, AppSpacing.lg)
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
                        } else if eventsLocked {
                            VStack(spacing: AppSpacing.sm) {
                                Text("La timeline des événements est réservée aux abonnés Premium.")
                                    .font(AppFont.body())
                                    .multilineTextAlignment(.center)
                                    .foregroundStyle(AppTheme.Colors.textSecondary)
                                Button("Passer à Premium") { showPaywall = true }
                                    .font(AppFont.caption())
                                    .foregroundStyle(AppTheme.Colors.accent)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, AppSpacing.lg)
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
            .sheet(isPresented: $showPaywall) {
                PaywallView()
            }
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
        eventsLocked = false
        isWakingVehicle = false
        wakeHintTask?.cancel()
        wakeHintTask = Task {
            try? await Task.sleep(nanoseconds: 3_000_000_000)
            guard !Task.isCancelled else { return }
            isWakingVehicle = true
        }
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
        wakeHintTask?.cancel()
        isWakingVehicle = false
        guard let vehicleId = vehicle?.id, !Task.isCancelled else {
            isLoading = false
            return
        }
        // Same reasoning as `vehicle` above: a failed refresh shouldn't wipe
        // an already-populated events list.
        do {
            events = try await environment.sentryService.fetchEvents(vehicleId: vehicleId)
        } catch APIError.premiumRequired {
            eventsLocked = true
            events = []
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

    private func setSentryMode(_ on: Bool) async {
        guard let vehicleId = vehicle?.id else { return }
        isTogglingSentry = true
        defer { isTogglingSentry = false }
        if (try? await environment.vehicleService.setSentryMode(vehicleId, on: on)) != nil {
            vehicle?.isSentryModeActive = on
        }
    }
}
