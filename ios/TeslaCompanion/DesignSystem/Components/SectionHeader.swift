import SwiftUI

struct SectionHeader: View {
    let title: String
    var actionTitle: String? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        HStack {
            Text(title)
                .font(AppFont.title())
                .foregroundStyle(AppTheme.Colors.textPrimary)
            Spacer()
            if let actionTitle, let action {
                Button(action: action) {
                    HStack(spacing: 2) {
                        Text(actionTitle)
                        Image(systemName: "chevron.right")
                            .font(.system(size: 10, weight: .semibold))
                    }
                }
                .font(AppFont.body())
                .foregroundStyle(AppTheme.Colors.accent)
            }
        }
    }
}
