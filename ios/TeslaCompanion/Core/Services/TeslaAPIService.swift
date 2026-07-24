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

    func lock(_ vehicleId: String, locked: Bool) async throws {
        let body = try JSONEncoder().encode(["locked": locked])
        try await client.send(
            Endpoint(path: "vehicles/\(vehicleId)/command/lock", method: "POST", body: body),
            authToken: auth.accessToken
        ) as EmptyResponse
    }

    func setClimate(_ vehicleId: String, on: Bool, targetTempC: Double) async throws {
        let body = try JSONEncoder().encode(ClimateCommandBody(on: on, targetTempC: targetTempC))
        try await client.send(
            Endpoint(path: "vehicles/\(vehicleId)/command/climate", method: "POST", body: body),
            authToken: auth.accessToken
        ) as EmptyResponse
    }

    func setChargeLimit(_ vehicleId: String, percent: Int) async throws {
        let body = try JSONEncoder().encode(["percent": percent])
        try await client.send(
            Endpoint(path: "vehicles/\(vehicleId)/command/charge-limit", method: "POST", body: body),
            authToken: auth.accessToken
        ) as EmptyResponse
    }

    func startCharging(_ vehicleId: String) async throws {
        try await client.send(
            Endpoint(path: "vehicles/\(vehicleId)/command/charge-start", method: "POST"),
            authToken: auth.accessToken
        ) as EmptyResponse
    }

    func stopCharging(_ vehicleId: String) async throws {
        try await client.send(
            Endpoint(path: "vehicles/\(vehicleId)/command/charge-stop", method: "POST"),
            authToken: auth.accessToken
        ) as EmptyResponse
    }

    func flashLights(_ vehicleId: String) async throws {
        try await client.send(
            Endpoint(path: "vehicles/\(vehicleId)/command/flash-lights", method: "POST"),
            authToken: auth.accessToken
        ) as EmptyResponse
    }

    func honkHorn(_ vehicleId: String) async throws {
        try await client.send(
            Endpoint(path: "vehicles/\(vehicleId)/command/honk-horn", method: "POST"),
            authToken: auth.accessToken
        ) as EmptyResponse
    }

    func fetchChargingSessions(vehicleId: String) async throws -> [ChargingSession] {
        try await client.send(Endpoint(path: "vehicles/\(vehicleId)/charging-sessions"), authToken: auth.accessToken)
    }

    func fetchDrivingSessions(vehicleId: String) async throws -> [DrivingSession] {
        try await client.send(Endpoint(path: "vehicles/\(vehicleId)/driving-sessions"), authToken: auth.accessToken)
    }

    func fetchMonthlySummary(vehicleId: String) async throws -> MonthlySummary {
        try await client.send(Endpoint(path: "vehicles/\(vehicleId)/summary"), authToken: auth.accessToken)
    }
}

private struct ClimateCommandBody: Encodable {
    let on: Bool
    let targetTempC: Double
}
