import Foundation

struct ChargeState: Codable, Hashable {
    var batteryLevel: Int
    var rangeKm: Double
    var chargeLimit: Int
    var isCharging: Bool
    var chargePowerKw: Double
    var minutesToFull: Int?
    var pluggedIn: Bool
}

struct ChargingSession: Identifiable, Codable, Hashable {
    let id: UUID
    var date: Date
    var location: String
    var energyAddedKWh: Double
    var cost: Double
    var durationMinutes: Int
    var startBatteryLevel: Int
    var endBatteryLevel: Int
}
