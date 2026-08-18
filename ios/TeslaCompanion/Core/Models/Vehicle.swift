import Foundation

enum VehicleState: String, Codable {
    case online, asleep, offline
}

/// The vehicle's live coordinates, relayed straight through from Tesla —
/// used only for an on-demand WeatherKit lookup (see
/// SentinelActivationCard) and never persisted anywhere, on-device or on
/// the backend.
struct Coordinate: Codable, Hashable {
    var latitude: Double
    var longitude: Double
}

struct Vehicle: Identifiable, Codable, Hashable {
    let id: String
    var displayName: String
    var vin: String
    var state: VehicleState
    var isSentryModeActive: Bool
    var location: Coordinate?
}
