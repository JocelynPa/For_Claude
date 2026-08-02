import SwiftUI

/// Splash shown for a beat right after the static launch screen — same
/// background color so the handoff is seamless — replaying the app icon's
/// radar-ping motif (rings closing in on a dot) as a looping animation
/// instead of a static image.
struct LaunchAnimationView: View {
    var body: some View {
        ZStack {
            AppTheme.Colors.background.ignoresSafeArea()
            RadarPingView()
        }
    }
}

private struct RadarPingView: View {
    private let ringCount = 3
    private let dotSize: CGFloat = 34
    private let maxRingSize: CGFloat = 200
    @State private var animate = false

    var body: some View {
        ZStack {
            ForEach(0..<ringCount, id: \.self) { index in
                Circle()
                    .stroke(AppTheme.Colors.accent, lineWidth: 3)
                    .frame(width: animate ? maxRingSize : dotSize, height: animate ? maxRingSize : dotSize)
                    .opacity(animate ? 0 : 0.85)
                    .animation(
                        .easeOut(duration: 1.6)
                            .repeatForever(autoreverses: false)
                            .delay(Double(index) * 0.4),
                        value: animate
                    )
            }

            Circle()
                .fill(AppTheme.Colors.accent)
                .frame(width: dotSize, height: dotSize)
        }
        .onAppear { animate = true }
    }
}
