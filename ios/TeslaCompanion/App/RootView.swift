import SwiftUI

struct RootView: View {
    @EnvironmentObject private var auth: AuthManager
    @State private var showLaunchAnimation = true
    @AppStorage("has_seen_onboarding") private var hasSeenOnboarding = false

    var body: some View {
        ZStack {
            Group {
                if auth.isAuthenticated {
                    MainTabView()
                } else if !hasSeenOnboarding {
                    OnboardingView(onFinish: { hasSeenOnboarding = true })
                } else {
                    LoginView()
                }
            }
            .animation(.easeInOut, value: auth.isAuthenticated)

            if showLaunchAnimation {
                LaunchAnimationView()
                    .transition(.opacity)
            }
        }
        .task {
            try? await Task.sleep(nanoseconds: 1_400_000_000)
            withAnimation(.easeInOut(duration: 0.4)) {
                showLaunchAnimation = false
            }
        }
    }
}
