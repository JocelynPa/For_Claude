import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem { Label("Véhicule", systemImage: "car.side.fill") }

            StatsView()
                .tabItem { Label("Statistiques", systemImage: "chart.bar.fill") }

            SentryHomeView()
                .tabItem { Label("Sentry", systemImage: "shield.lefthalf.filled") }

            SettingsView()
                .tabItem { Label("Réglages", systemImage: "gearshape.fill") }
        }
        .tint(AppTheme.Colors.accent)
    }
}
