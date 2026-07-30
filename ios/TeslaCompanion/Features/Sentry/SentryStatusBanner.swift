import SwiftUI

/// Small animated recording-style dot: a solid center with an outward
/// expanding, fading ring, looping — the classic "live/armed" visual cue.
struct SentryPulseIndicator: View {
    @State private var isPulsing = false

    var body: some View {
        ZStack {
            Circle()
                .fill(AppTheme.Colors.danger.opacity(0.35))
                .frame(width: 14, height: 14)
                .scaleEffect(isPulsing ? 2.4 : 1)
                .opacity(isPulsing ? 0 : 1)
                .animation(.easeOut(duration: 1.4).repeatForever(autoreverses: false), value: isPulsing)
            Circle()
                .fill(AppTheme.Colors.danger)
                .frame(width: 8, height: 8)
        }
        .frame(width: 14, height: 14)
        .onAppear { isPulsing = true }
    }
}

struct SentryStatusBanner: View {
    let isActive: Bool

    var body: some View {
        Card {
            HStack(spacing: AppSpacing.sm) {
                if isActive {
                    SentryPulseIndicator()
                } else {
                    Circle()
                        .fill(AppTheme.Colors.textSecondary.opacity(0.4))
                        .frame(width: 8, height: 8)
                }
                Text(isActive ? "Sentry Mode actif" : "Sentry Mode inactif")
                    .font(AppFont.headline())
                    .foregroundStyle(AppTheme.Colors.textPrimary)
                Spacer()
            }
        }
    }
}
