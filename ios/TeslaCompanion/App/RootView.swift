import SwiftUI

struct RootView: View {
    @EnvironmentObject private var auth: AuthManager
    @EnvironmentObject private var environment: AppEnvironment

    var body: some View {
        Group {
            if auth.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
        .animation(.easeInOut, value: auth.isAuthenticated)
        .task(id: auth.isAuthenticated) {
            if auth.isAuthenticated {
                environment.pushManager.requestAuthorizationIfEnabled()
            }
        }
    }
}
