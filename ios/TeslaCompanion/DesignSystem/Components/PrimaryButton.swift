import SwiftUI

struct PrimaryButton: View {
    let title: String
    var icon: String? = nil
    var isLoading: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: AppSpacing.sm) {
                if isLoading {
                    ProgressView().tint(AppTheme.Colors.background)
                } else {
                    if let icon {
                        Image(systemName: icon)
                    }
                    Text(title).font(AppFont.headline())
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .foregroundStyle(AppTheme.Colors.background)
            .background(
                LinearGradient(
                    colors: [AppTheme.Colors.accent, AppTheme.Colors.accent.opacity(0.85)],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
            .shadow(color: AppTheme.Colors.accent.opacity(0.35), radius: 14, x: 0, y: 6)
        }
        .disabled(isLoading)
    }
}
