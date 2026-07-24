import SwiftUI

enum PillBadgeStyle {
    case neutral, success, warning, danger, accent

    var color: Color {
        switch self {
        case .neutral: AppTheme.Colors.textSecondary
        case .success: AppTheme.Colors.success
        case .warning: AppTheme.Colors.warning
        case .danger: AppTheme.Colors.danger
        case .accent: AppTheme.Colors.accent
        }
    }
}

struct PillBadge: View {
    let text: String
    var style: PillBadgeStyle = .neutral

    var body: some View {
        Text(text)
            .font(AppFont.caption())
            .foregroundStyle(style.color)
            .padding(.horizontal, AppSpacing.sm)
            .padding(.vertical, 4)
            .background(style.color.opacity(0.12))
            .clipShape(Capsule())
    }
}
