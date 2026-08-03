import Foundation

/// Fired by the backend (not the app — works even with the app closed) when
/// the Fleet Telemetry ingestor records an "activityDetected" entry.
enum SentryAutoAction: String, CaseIterable, Codable {
    case none
    case honk
    case flash
    case lock

    var label: String {
        switch self {
        case .none: "Aucune"
        case .honk: "Klaxon"
        case .flash: "Phares"
        case .lock: "Verrouiller les portes"
        }
    }
}

struct AppSettings: Codable {
    var sentryAutoAction: SentryAutoAction
    var wheelOptionCode: String?
}

/// Tesla's `option_codes` (needed to render the exact wheels in the vehicle
/// image) isn't populated by the Fleet API — see
/// backend/src/services/teslaVehicleImage.ts — so this is set manually as a
/// fallback for whenever automatic detection (`wheel_type`) doesn't already
/// cover the car. Options span all 4 supported models (Model 3/Y/S/X) since
/// the app doesn't know which model this vehicle is — picking one that
/// doesn't apply to your car is harmless though: the backend's per-model
/// option filtering silently drops it and falls back to default wheels
/// rather than rendering something wrong.
enum WheelStyle: Hashable, CaseIterable, Identifiable {
    case defaultWheels
    case induction20
    case apollo19
    case uberturbine21
    case aero18
    case photon18
    case sport19
    case tempest19
    case arachnid21
    case cyberstream20
    case turbine22

    var id: String { optionCode ?? "default" }

    var label: String {
        switch self {
        case .defaultWheels: "Jantes par défaut"
        case .induction20: "20″ Induction, noires (Model Y)"
        case .apollo19: "19″ Apollo (Model Y)"
        case .uberturbine21: "21″ Uberturbine (Model Y)"
        case .aero18: "18″ Aero (Model 3)"
        case .photon18: "18″ Photon (Model 3)"
        case .sport19: "19″ Sport (Model 3)"
        case .tempest19: "19″ Tempest (Model S)"
        case .arachnid21: "21″ Arachnid (Model S)"
        case .cyberstream20: "20″ Cyberstream (Model X)"
        case .turbine22: "22″ Turbine (Model X)"
        }
    }

    var optionCode: String? {
        switch self {
        case .defaultWheels: nil
        case .induction20: "WY20P"
        case .apollo19: "WY9S"
        case .uberturbine21: "WY1S"
        case .aero18: "W38B"
        case .photon18: "W38A"
        case .sport19: "W39B"
        case .tempest19: "WS90"
        case .arachnid21: "WS10"
        case .cyberstream20: "WX00"
        case .turbine22: "WX20"
        }
    }

    init(optionCode: String?) {
        self = Self.allCases.first { $0.optionCode == optionCode } ?? .defaultWheels
    }
}
