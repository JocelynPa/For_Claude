import Foundation

enum SentryTimelineKind: String, Codable {
    case vehicleOnline
    case vehicleOffline
    case sentryModeEnabled
    case sentryModeDisabled
    case activityDetected

    var label: String {
        switch self {
        case .vehicleOnline: "Véhicule en ligne"
        case .vehicleOffline: "Véhicule hors ligne"
        case .sentryModeEnabled: "Sentinel activé"
        case .sentryModeDisabled: "Sentinel désactivé"
        case .activityDetected: "Activité détectée"
        }
    }
}

/// Mirrors Tesla's real `SentryModeState` values (protos/vehicle_data.proto
/// in teslamotors/fleet-telemetry) for the two states worth surfacing as an
/// activity: Aware (something nearby, cameras watching closely) and Panic
/// (a security event — alarm/lights triggered). Off/Idle/Armed/Quiet map to
/// plain enabled/disabled transitions instead, not an activity entry.
enum SentryAwarenessLevel: String, Codable {
    case aware, panic

    var label: String {
        switch self {
        case .aware: "Aware"
        case .panic: "Panic"
        }
    }
}

struct SentryFiredAction: Codable, Hashable {
    var label: String
    var systemImage: String
}

/// A single row in the Sentry timeline: either a plain vehicle/Sentry state
/// transition (online/offline, Sentry enabled/disabled), or a richer
/// activity-detected entry — text only, no image or video, matching how
/// Sentry Mode's own alert history works (no live/remote camera access
/// exists via Tesla's API either way, see SentryHomeView).
struct SentryTimelineEntry: Identifiable, Codable, Hashable {
    let id: UUID
    var date: Date
    var kind: SentryTimelineKind

    // Only set when kind == .activityDetected.
    var activityDescription: String?
    var awarenessLevel: SentryAwarenessLevel?
    var firedActions: [SentryFiredAction]

    // Battery level (0-100) at the time of this entry — only set on
    // sentryModeEnabled/Disabled entries. Paired up in EventTimelineView to
    // show what was consumed during a Sentry session; this is total vehicle
    // consumption while parked with Sentry on, not draw isolated to Sentry
    // itself (Tesla doesn't expose that breakdown).
    var batteryLevelPercent: Int?

    var isNew: Bool
}
