import Foundation

/// In-memory implementation used by default so the app is fully browsable
/// (in Previews and the Simulator) without a running backend or a real
/// Tesla account. Swap for `TeslaAPIService` in `AppEnvironment` once the
/// backend is deployed.
final class MockVehicleService: VehicleServicing {
    private var vehicle = Vehicle(
        id: "mock-1",
        displayName: "Mon Model 3",
        vin: "5YJ3E1EA0PF000000",
        state: .online,
        isSentryModeActive: true,
        // Same compositor endpoint the backend builds for real vehicles
        // (see backend/src/services/teslaVehicleImage.ts) — a minimal,
        // valid Model 3 render, so Previews/Simulator show a real vehicle
        // image rather than a blank space.
        imageUrl: URL(string: "https://static-assets.tesla.com/configurator/compositor?bkba_opt=1&file_type=png&model=m3&options=IN3PB&view=STUD_3QTR&size=800")
    )

    func fetchVehicles() async throws -> [Vehicle] {
        try await Task.sleep(nanoseconds: 400_000_000)
        return [vehicle]
    }

    func setSentryMode(_ vehicleId: String, on: Bool) async throws {
        vehicle.isSentryModeActive = on
    }
}
