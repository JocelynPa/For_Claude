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

struct CameraGridView: View {
    private let columns = [GridItem(.flexible(), spacing: AppSpacing.sm), GridItem(.flexible(), spacing: AppSpacing.sm)]

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                SectionHeader(title: "Caméras en direct")
                LazyVGrid(columns: columns, spacing: AppSpacing.sm) {
                    ForEach(SentryCamera.allCases, id: \.self) { camera in
                        VStack(spacing: AppSpacing.xs) {
                            ZStack {
                                RoundedRectangle(cornerRadius: AppRadius.sm, style: .continuous)
                                    .fill(AppTheme.Colors.surfaceElevated)
                                Image(systemName: "video.slash.fill")
                                    .foregroundStyle(AppTheme.Colors.textSecondary)
                            }
                            .aspectRatio(16.0 / 10.0, contentMode: .fit)
                            Text(camera.label)
                                .font(AppFont.caption())
                                .foregroundStyle(AppTheme.Colors.textSecondary)
                        }
                    }
                }
                Text("Le flux en direct nécessite que le véhicule soit réveillé et connecté.")
                    .font(AppFont.caption())
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }
        }
    }
}
