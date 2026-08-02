import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            SentryHomeView()
                .tabItem { Label("Sentry", systemImage: "shield.lefthalf.filled") }

            SettingsView()
                .tabItem { Label("Réglages", systemImage: "gearshape.fill") }
        }
        .tint(AppTheme.Colors.accent)
    }
}
