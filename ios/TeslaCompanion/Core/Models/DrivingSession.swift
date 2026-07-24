import Foundation

struct DrivingSession: Identifiable, Codable, Hashable {
    let id: UUID
    var date: Date
    var distanceKm: Double
    var durationMinutes: Int
    var efficiencyWhPerKm: Double
    var averageSpeedKmh: Double
}

struct MonthlySummary: Codable, Hashable {
    var month: Date
    var distanceKm: Double
    var energyCost: Double
    var co2SavedKg: Double
    var averageEfficiencyWhPerKm: Double
}
