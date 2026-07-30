import Foundation

protocol SentryServicing {
    func fetchEvents(vehicleId: String) async throws -> [SentryTimelineEntry]
    func markAllSeen(vehicleId: String) async throws
    func deleteEvent(_ eventId: UUID) async throws
}
