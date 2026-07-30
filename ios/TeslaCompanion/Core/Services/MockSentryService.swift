import Foundation

final class MockSentryService: SentryServicing {
    private var entries: [SentryTimelineEntry] = MockSentryService.generateEntries()

    func fetchEvents(vehicleId: String) async throws -> [SentryTimelineEntry] {
        try await Task.sleep(nanoseconds: 350_000_000)
        return entries
    }

    func markAllSeen(vehicleId: String) async throws {
        entries = entries.map { var entry = $0; entry.isNew = false; return entry }
    }

    func deleteEvent(_ eventId: UUID) async throws {
        entries.removeAll { $0.id == eventId }
    }

    private static func generateEntries() -> [SentryTimelineEntry] {
        let calendar = Calendar.current

        func stateChange(_ kind: SentryTimelineKind, minutesAgo: Int, isNew: Bool = false) -> SentryTimelineEntry {
            SentryTimelineEntry(
                id: UUID(),
                date: calendar.date(byAdding: .minute, value: -minutesAgo, to: .now) ?? .now,
                kind: kind,
                activityDescription: nil,
                awarenessLevel: nil,
                firedActions: [],
                isNew: isNew
            )
        }

        func activity(
            minutesAgo: Int,
            description: String,
            level: SentryAwarenessLevel,
            fired: [SentryFiredAction] = [],
            isNew: Bool = false
        ) -> SentryTimelineEntry {
            SentryTimelineEntry(
                id: UUID(),
                date: calendar.date(byAdding: .minute, value: -minutesAgo, to: .now) ?? .now,
                kind: .activityDetected,
                activityDescription: description,
                awarenessLevel: level,
                firedActions: fired,
                isNew: isNew
            )
        }

        return [
            stateChange(.vehicleOffline, minutesAgo: 60),
            stateChange(.sentryModeDisabled, minutesAgo: 78),
            stateChange(.sentryModeEnabled, minutesAgo: 78),
            stateChange(.sentryModeDisabled, minutesAgo: 78),
            activity(
                minutesAgo: 82,
                description: "Quelqu'un s'approche du véhicule",
                level: .aware,
                fired: [SentryFiredAction(label: "Klaxon", systemImage: "speaker.wave.2.fill")],
                isNew: true
            ),
            stateChange(.sentryModeEnabled, minutesAgo: 95, isNew: true),
            stateChange(.vehicleOnline, minutesAgo: 108),
            stateChange(.vehicleOffline, minutesAgo: 445),
            stateChange(.sentryModeEnabled, minutesAgo: 450),
            stateChange(.vehicleOnline, minutesAgo: 500),
            stateChange(.vehicleOffline, minutesAgo: 1800),
            stateChange(.vehicleOnline, minutesAgo: 1848),
            stateChange(.vehicleOffline, minutesAgo: 1889),
            stateChange(.vehicleOnline, minutesAgo: 1922),
            stateChange(.vehicleOffline, minutesAgo: 1969),
        ]
    }
}
