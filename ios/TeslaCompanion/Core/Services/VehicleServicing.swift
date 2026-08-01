import Foundation

protocol VehicleServicing {
    func fetchVehicles() async throws -> [Vehicle]
    func setSentryMode(_ vehicleId: String, on: Bool) async throws
}
