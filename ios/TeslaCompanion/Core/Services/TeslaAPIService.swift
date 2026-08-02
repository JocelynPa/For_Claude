import Foundation

/// Real implementation that talks to the Tesla Companion backend, which in
/// turn proxies signed requests to Tesla's Fleet API. Not wired in by
/// default — see `AppEnvironment`.
final class TeslaAPIService: VehicleServicing {
    private let client = APIClient.shared
    private let auth: AuthManager

    init(auth: AuthManager) {
        self.auth = auth
    }

    func fetchVehicles() async throws -> [Vehicle] {
        try await client.send(Endpoint(path: "vehicles"), authToken: auth.accessToken)
    }

    func setSentryMode(_ vehicleId: String, on: Bool) async throws {
        let body = try JSONEncoder().encode(["on": on])
        try await client.send(
            Endpoint(path: "vehicles/\(vehicleId)/command/set-sentry-mode", method: "POST", body: body),
            authToken: auth.accessToken
        ) as EmptyResponse
    }
}
