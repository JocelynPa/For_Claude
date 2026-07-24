import SwiftUI

/// Central design tokens for the app: a sober, editorial palette (graphite,
/// off-white, restrained indigo accent) that adapts to light and dark mode,
/// rather than reproducing Tesla's own red-on-black branding.
enum AppTheme {
    enum Colors {
        static let background = Color(light: 0xF5F5F7, dark: 0x0A0A0B)
        static let surface = Color(light: 0xFFFFFF, dark: 0x151517)
        static let surfaceElevated = Color(light: 0xFFFFFF, dark: 0x1E1E21)
        static let border = Color(light: 0xE3E3E6, dark: 0x2A2A2E)

        static let textPrimary = Color(light: 0x111113, dark: 0xF5F5F7)
        static let textSecondary = Color(light: 0x6B6B70, dark: 0x9A9AA0)

        static let accent = Color(light: 0x2F55D4, dark: 0x7C93FF)
        static let success = Color(light: 0x1F9254, dark: 0x34D399)
        static let warning = Color(light: 0xB7791F, dark: 0xF5B84C)
        static let danger = Color(light: 0xC53030, dark: 0xFF6B6B)
    }
}

enum AppFont {
    static func largeTitle() -> Font { .system(size: 32, weight: .bold) }
    static func title() -> Font { .system(size: 20, weight: .semibold) }
    static func headline() -> Font { .system(size: 16, weight: .semibold) }
    static func body() -> Font { .system(size: 15, weight: .regular) }
    static func caption() -> Font { .system(size: 12, weight: .medium) }
    static func statValue() -> Font { .system(size: 26, weight: .bold, design: .rounded) }
    static func statLabel() -> Font { .system(size: 11, weight: .semibold, design: .rounded) }
}

enum AppSpacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
}

enum AppRadius {
    static let sm: CGFloat = 8
    static let md: CGFloat = 14
    static let lg: CGFloat = 20
    static let pill: CGFloat = 999
}
