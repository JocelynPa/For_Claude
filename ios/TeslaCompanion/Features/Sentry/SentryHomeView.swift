import SwiftUI

struct SentryHomeView: View {
    @EnvironmentObject private var environment: AppEnvironment
    @State private var vehicle: Vehicle?
    @State private var events: [SentryTimelineEntry] = []
    @State private var isLoading = true

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: AppSpacing.lg) {
                    if let vehicle {
                        SentryStatusBanner(isActive: vehicle.isSentryModeActive)
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
                            EventTimelineView(events: events)
                        }
                    }
                }
                .padding(AppSpacing.md)
            }
            .background(AppTheme.Colors.background)
            .navigationTitle("Sentry Mode")
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private func load() async {
        isLoading = true
        vehicle = try? await environment.vehicleService.fetchVehicles().first
        guard let vehicleId = vehicle?.id else {
            isLoading = false
            return
        }
        events = (try? await environment.sentryService.fetchEvents(vehicleId: vehicleId)) ?? []
        isLoading = false
    }

    private func markAllSeen() async {
        guard let vehicleId = vehicle?.id else { return }
        try? await environment.sentryService.markAllSeen(vehicleId: vehicleId)
        events = events.map { var event = $0; event.isNew = false; return event }
    }
}
