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
    /// Tesla's own image compositor (undocumented but public), rendering
    /// this exact vehicle — model, paint, wheels. Nil when the car type
    /// isn't supported (e.g. Cybertruck) or data is unavailable; the UI
    /// falls back to a generic glyph in that case.
    var imageUrl: URL?
}
