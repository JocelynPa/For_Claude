import SwiftUI

extension Color {
    /// The app is dark-only by design (see `AppTheme`/`TeslaCompanionApp`),
    /// so tokens are plain fixed colors rather than light/dark pairs.
    init(hex: UInt32, alpha: CGFloat = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: alpha
        )
    }
}
