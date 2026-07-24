import Foundation

struct ClimateState: Codable, Hashable {
    var isOn: Bool
    var insideTempC: Double
    var outsideTempC: Double
    var targetTempC: Double
    var isPreconditioning: Bool
}
