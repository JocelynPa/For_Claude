import Foundation

protocol SentryServicing {
    func fetchEvents(vehicleId: String) async throws -> [SentryEvent]
    func markAllSeen(vehicleId: String) async throws
    func deleteEvent(_ eventId: UUID) async throws
}
