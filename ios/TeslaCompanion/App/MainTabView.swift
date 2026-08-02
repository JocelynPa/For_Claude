import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            SentryHomeView()
                .tabItem { Label("Sentinel", systemImage: "shield.lefthalf.filled") }

            SettingsView()
                .tabItem { Label("Réglages", systemImage: "gearshape.fill") }
        }
        .tint(AppTheme.Colors.accent)
    }
}
