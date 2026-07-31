import SwiftUI

/// A bordered, elevated surface used as the base container across the app.
/// A faint top-to-bottom gradient and hairline edge give it a touch of
/// depth on the dark background, rather than a flat fill.
struct Card<Content: View>: View {
    var padding: CGFloat = AppSpacing.md
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .background(
                LinearGradient(
                    colors: [AppTheme.Colors.surfaceElevated, AppTheme.Colors.surface],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                    .stroke(AppTheme.Colors.hairline, lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.35), radius: 16, x: 0, y: 8)
    }
}
