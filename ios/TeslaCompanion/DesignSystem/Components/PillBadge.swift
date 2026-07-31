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
            .fontWeight(.semibold)
            .foregroundStyle(style.color)
            .padding(.horizontal, AppSpacing.sm + 2)
            .padding(.vertical, 5)
            .background(style.color.opacity(0.14))
            .overlay(Capsule().stroke(style.color.opacity(0.3), lineWidth: 1))
            .clipShape(Capsule())
    }
}
