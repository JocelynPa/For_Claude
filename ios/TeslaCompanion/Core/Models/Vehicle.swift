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
    /// Tesla's own image compositor (undocumented but public), rendering
    /// this exact vehicle — model, paint, wheels. Nil when the car type
    /// isn't supported (e.g. Cybertruck) or option codes are unavailable;
    /// the UI falls back to a generic glyph in that case.
    var imageUrl: URL?
    var state: VehicleState
    var battery: ChargeState
    var climate: ClimateState
    var isLocked: Bool
    var isSentryModeActive: Bool
    var odometerKm: Double
}
