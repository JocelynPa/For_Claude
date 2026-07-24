import SwiftUI

/// A bordered, elevated surface used as the base container across the app.
struct Card<Content: View>: View {
    var padding: CGFloat = AppSpacing.md
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .background(AppTheme.Colors.surface)
            .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                    .stroke(AppTheme.Colors.border, lineWidth: 1)
            )
    }
}
