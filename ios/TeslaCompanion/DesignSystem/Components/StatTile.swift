import SwiftUI

struct StatTile: View {
    let value: String
    let label: String
    var icon: String? = nil
    var tint: Color = AppTheme.Colors.accent

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            if let icon {
                Image(systemName: icon)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(tint)
            }
            Text(value)
                .font(AppFont.statValue())
                .foregroundStyle(AppTheme.Colors.textPrimary)
            Text(label.uppercased())
                .font(AppFont.statLabel())
                .foregroundStyle(AppTheme.Colors.textSecondary)
                .tracking(0.8)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
