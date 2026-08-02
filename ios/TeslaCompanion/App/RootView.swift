import SwiftUI

struct RootView: View {
    @EnvironmentObject private var auth: AuthManager
    @State private var showLaunchAnimation = true

    var body: some View {
        ZStack {
            Group {
                if auth.isAuthenticated {
                    MainTabView()
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
