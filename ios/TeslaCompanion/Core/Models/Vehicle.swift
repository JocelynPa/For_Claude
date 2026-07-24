import Foundation

enum VehicleState: String, Codable {
    case online, asleep, offline
}

struct Vehicle: Identifiable, Codable, Hashable {
    let id: String
    var displayName: String
    var vin: String
    var model: String
    var color: String
    var state: VehicleState
    var battery: ChargeState
    var climate: ClimateState
    var isLocked: Bool
    var odometerKm: Double
}
