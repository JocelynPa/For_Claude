import SwiftUI

struct SentryHomeView: View {
    @EnvironmentObject private var environment: AppEnvironment
    @State private var events: [SentryEvent] = []
    @State private var selectedEvent: SentryEvent?
    @State private var isLoading = true

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppSpacing.lg) {
                    CameraGridView()

                    Card {
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
                                EventTimelineView(events: events) { event in
                                    selectedEvent = event
                                }
                            }
                        }
                    }
                }
                .padding(AppSpacing.md)
            }
            .background(AppTheme.Colors.background)
            .navigationTitle("Sentry Mode")
            .task { await load() }
            .refreshable { await load() }
            .sheet(item: $selectedEvent) { event in
                ClipPlayerView(event: event)
            }
        }
    }

    private func load() async {
        isLoading = true
        guard let vehicleId = try? await environment.vehicleService.fetchVehicles().first?.id else {
            isLoading = false
            return
        }
        events = (try? await environment.sentryService.fetchEvents(vehicleId: vehicleId)) ?? []
        isLoading = false
    }

    private func markAllSeen() async {
        guard let vehicleId = try? await environment.vehicleService.fetchVehicles().first?.id else { return }
        try? await environment.sentryService.markAllSeen(vehicleId: vehicleId)
        events = events.map { var event = $0; event.isNew = false; return event }
    }
}

/// Tesla exposes no live camera stream through any public API (Fleet API,
/// Owner API, or otherwise) — not to third-party apps, and not even to
/// Tesla's own official app. Sentry/dashcam footage only exists as clips
/// saved to a USB drive physically plugged into the car; there's no remote
/// live view to build here, so this card explains that instead of
/// pretending a camera grid could ever show anything.
struct CameraGridView: View {
    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                HStack(spacing: AppSpacing.sm) {
                    Image(systemName: "info.circle.fill")
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                    Text("Caméras")
                        .font(AppFont.title())
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                }
                Text("""
                Tesla ne propose aucun flux caméra en direct via son API, pour \
                aucune application tierce — ni même dans son app officielle. \
                Seuls les clips Sentry enregistrés sur la clé USB du véhicule \
                existent ; ils apparaissent ci-dessous une fois synchronisés \
                depuis cette clé.
                """)
                    .font(AppFont.body())
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }
        }
    }
}
