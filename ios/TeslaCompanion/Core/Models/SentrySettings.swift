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

/// ISO weekday numbering (1=Monday..7=Sunday), matching what the backend
/// stores/expects in `SentrySchedule.days`.
enum Weekday: Int, CaseIterable, Identifiable {
    case monday = 1, tuesday, wednesday, thursday, friday, saturday, sunday

    var id: Int { rawValue }

    var shortLabel: String {
        switch self {
        case .monday: "L"
        case .tuesday: "M"
        case .wednesday: "M"
        case .thursday: "J"
        case .friday: "V"
        case .saturday: "S"
        case .sunday: "D"
        }
    }
}

/// A recurring window during which the server turns Sentry Mode on/off by
/// itself — applied backend-side (see `sentrySchedule.ts`) so it still
/// fires with the app closed or the phone off. `start`/`end` are "HH:mm";
/// `end` earlier than `start` means the window wraps past midnight.
struct SentrySchedule: Codable, Equatable {
    var enabled: Bool
    var start: String
    var end: String
    var days: [Int]
    var timezone: String

    static let `default` = SentrySchedule(
        enabled: false,
        start: "20:00",
        end: "07:00",
        days: Weekday.allCases.map(\.rawValue),
        timezone: TimeZone.current.identifier
    )
}

struct AppSettings: Codable {
    var sentryAutoAction: SentryAutoAction
    var sentrySchedule: SentrySchedule
}
