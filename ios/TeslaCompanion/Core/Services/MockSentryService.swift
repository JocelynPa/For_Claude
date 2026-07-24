import Foundation

final class MockSentryService: SentryServicing {
    private var events: [SentryEvent] = {
        let calendar = Calendar.current
        let kinds: [SentryEventKind] = [.sentry, .dashcamSaved, .honk]
        return (0..<9).map { index in
            let kind = kinds[index % kinds.count]
            return SentryEvent(
                id: UUID(),
                date: calendar.date(byAdding: .hour, value: -index * 7, to: .now) ?? .now,
                kind: kind,
                cameras: [.front, .back, .left, .right].shuffled().prefix(Int.random(in: 1...4)).map { $0 },
                durationSeconds: Int.random(in: 8...45),
                location: index % 2 == 0 ? "Domicile" : "Parking Centre Ville",
                isNew: index < 3
            )
        }
    }()

    func fetchEvents(vehicleId: String) async throws -> [SentryEvent] {
        try await Task.sleep(nanoseconds: 350_000_000)
        return events
    }

    func markAllSeen(vehicleId: String) async throws {
        events = events.map { var event = $0; event.isNew = false; return event }
    }

    func deleteEvent(_ eventId: UUID) async throws {
        events.removeAll { $0.id == eventId }
    }
}
