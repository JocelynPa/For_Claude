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
}
