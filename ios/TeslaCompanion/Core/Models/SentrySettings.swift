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
/// backend/src/services/teslaVehicleImage.ts — so this is set manually.
/// Only wheel styles independently confirmed against a real Tesla option
/// code reference are offered; anything else keeps the compositor's default
/// rather than risk a made-up code.
enum WheelStyle: Hashable, CaseIterable, Identifiable {
    case defaultWheels
    case induction20

    var id: String { optionCode ?? "default" }

    var label: String {
        switch self {
        case .defaultWheels: "Jantes par défaut"
        case .induction20: "20″ Induction (noires)"
        }
    }

    var optionCode: String? {
        switch self {
        case .defaultWheels: nil
        case .induction20: "WY20P"
        }
    }

    init(optionCode: String?) {
        self = Self.allCases.first { $0.optionCode == optionCode } ?? .defaultWheels
    }
}
