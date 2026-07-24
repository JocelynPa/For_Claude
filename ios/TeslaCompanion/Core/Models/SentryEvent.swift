import Foundation

enum SentryCamera: String, Codable, CaseIterable {
    case front, back, left, right

    var label: String {
        switch self {
        case .front: "Avant"
        case .back: "Arrière"
        case .left: "Gauche"
        case .right: "Droite"
        }
    }
}

enum SentryEventKind: String, Codable {
    case sentry, dashcamSaved, honk

    var label: String {
        switch self {
        case .sentry: "Alerte Sentry"
        case .dashcamSaved: "Clip sauvegardé"
        case .honk: "Klaxon"
        }
    }

    var icon: String {
        switch self {
        case .sentry: "shield.lefthalf.filled"
        case .dashcamSaved: "video.fill"
        case .honk: "horn.fill"
        }
    }
}

struct SentryEvent: Identifiable, Codable, Hashable {
    let id: UUID
    var date: Date
    var kind: SentryEventKind
    var cameras: [SentryCamera]
    var durationSeconds: Int
    var location: String
    var isNew: Bool

    var thumbnailSystemImage: String { kind.icon }
}
