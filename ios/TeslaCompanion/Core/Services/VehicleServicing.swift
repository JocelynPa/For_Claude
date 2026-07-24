import Foundation

protocol VehicleServicing {
    func fetchVehicles() async throws -> [Vehicle]
    func lock(_ vehicleId: String, locked: Bool) async throws
    func setClimate(_ vehicleId: String, on: Bool, targetTempC: Double) async throws
    func setChargeLimit(_ vehicleId: String, percent: Int) async throws
    func startCharging(_ vehicleId: String) async throws
    func stopCharging(_ vehicleId: String) async throws
    func flashLights(_ vehicleId: String) async throws
    func honkHorn(_ vehicleId: String) async throws
    func fetchChargingSessions(vehicleId: String) async throws -> [ChargingSession]
    func fetchDrivingSessions(vehicleId: String) async throws -> [DrivingSession]
    func fetchMonthlySummary(vehicleId: String) async throws -> MonthlySummary
}
