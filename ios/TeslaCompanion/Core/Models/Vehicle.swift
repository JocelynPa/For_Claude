import Foundation

enum VehicleState: String, Codable {
    case online, asleep, offline
}

struct Vehicle: Identifiable, Codable, Hashable {
    let id: String
    var displayName: String
    var vin: String
    var state: VehicleState
    var isSentryModeActive: Bool
}
