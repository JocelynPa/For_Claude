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
                    ProgressView().tint(.white)
                } else {
                    if let icon {
                        Image(systemName: icon)
                    }
                    Text(title).font(AppFont.headline())
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .foregroundStyle(.white)
            .background(AppTheme.Colors.accent)
            .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
        }
        .disabled(isLoading)
    }
}
