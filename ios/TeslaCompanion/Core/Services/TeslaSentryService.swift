import Foundation

/// Real implementation backed by the backend's Fleet Telemetry ingestion
/// pipeline (see backend/src/telemetry/ingestor.ts) — the timeline is only
/// populated once Fleet Telemetry is deployed and a vehicle has been
/// subscribed (deploy/README.md). Not wired in by default; see
/// `AppEnvironment`.
final class TeslaSentryService: SentryServicing {
    private let client = APIClient.shared
    private let auth: AuthManager

    init(auth: AuthManager) {
        self.auth = auth
    }

    func fetchEvents(vehicleId: String) async throws -> [SentryTimelineEntry] {
        try await client.send(Endpoint(path: "vehicles/\(vehicleId)/sentry-timeline"), authToken: auth.accessToken)
    }

    func markAllSeen(vehicleId: String) async throws {
        try await client.send(
            Endpoint(path: "vehicles/\(vehicleId)/sentry-timeline/mark-seen", method: "POST"),
            authToken: auth.accessToken
        ) as EmptyResponse
    }

    func deleteEvent(_ eventId: UUID) async throws {
        // The backend route needs the vehicle id too (`DELETE
        // /vehicles/:id/sentry-timeline/:entryId`), which this protocol
        // method doesn't carry — no UI calls this yet, so left unimplemented
        // rather than guessing at a vehicle id.
        throw APIError.invalidURL
    }
}
