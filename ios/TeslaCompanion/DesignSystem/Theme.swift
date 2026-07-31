import SwiftUI

/// Central design tokens for the app: a premium, dark-only palette —
/// deep anthracite, warm off-white, a restrained champagne-gold accent —
/// closer to the cockpit feel of the official Tesla app than a generic
/// iOS app that happens to support dark mode. See `TeslaCompanionApp`
/// for where dark mode is forced app-wide.
enum AppTheme {
    enum Colors {
        static let background = Color(hex: 0x0A0A0C)
        static let surface = Color(hex: 0x141416)
        static let surfaceElevated = Color(hex: 0x1C1C1F)
        static let border = Color(hex: 0x2A2A2E)
        /// Faint hairline used on top of colored/image surfaces for a
        /// glass-edge highlight — not a flat color swap like `border`.
        static let hairline = Color.white.opacity(0.08)

        static let textPrimary = Color(hex: 0xF5F3EE)
        static let textSecondary = Color(hex: 0x9B9BA2)

        /// Champagne gold — the app's one signature accent, used sparingly
        /// (progress fills, links, active states) rather than Tesla's own
        /// red, which stays reserved for Sentry/alerts below.
        static let accent = Color(hex: 0xC9A66B)
        static let success = Color(hex: 0x34D399)
        static let warning = Color(hex: 0xF5B84C)
        /// Tesla's own brand red — used only for Sentry/alert states, so it
        /// keeps its meaning as "something needs attention," not decoration.
        static let danger = Color(hex: 0xE31937)
    }
}

enum AppFont {
    static func largeTitle() -> Font { .system(size: 32, weight: .bold, design: .serif) }
    static func title() -> Font { .system(size: 20, weight: .semibold) }
    static func headline() -> Font { .system(size: 16, weight: .semibold) }
    static func body() -> Font { .system(size: 15, weight: .regular) }
    static func caption() -> Font { .system(size: 12, weight: .medium) }
    /// Serif, used only for hero numbers (battery %, range, stats) — a
    /// deliberate, sparing touch of editorial/instrument-cluster elegance
    /// against the sans-serif body copy everywhere else.
    static func statValue() -> Font { .system(size: 28, weight: .semibold, design: .serif) }
    static func statLabel() -> Font { .system(size: 11, weight: .semibold, design: .rounded) }
    /// Small uppercase "eyebrow" label above a section title.
    static func overline() -> Font { .system(size: 11, weight: .semibold, design: .rounded) }
}

enum AppSpacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
}

enum AppRadius {
    static let sm: CGFloat = 10
    static let md: CGFloat = 16
    static let lg: CGFloat = 26
    static let pill: CGFloat = 999
}
