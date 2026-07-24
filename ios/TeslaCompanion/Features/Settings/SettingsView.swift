import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var auth: AuthManager
    @State private var showPaywall = false
    @AppStorage("sentry_notifications_enabled") private var sentryNotifications = true
    @AppStorage("driving_reports_enabled") private var drivingReports = true

    var body: some View {
        NavigationStack {
            List {
                Section("Abonnement") {
                    Button {
                        showPaywall = true
                    } label: {
                        HStack {
                            Image(systemName: "sparkles").foregroundStyle(AppTheme.Colors.accent)
                            Text("Passer à Premium")
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundStyle(AppTheme.Colors.textSecondary)
                        }
                    }
                }

                Section("Notifications") {
                    Toggle("Alertes Sentry Mode", isOn: $sentryNotifications)
                    Toggle("Rapports de conduite", isOn: $drivingReports)
                }

                Section("Compte") {
                    Button(role: .destructive) {
                        auth.signOut()
                    } label: {
                        Text("Se déconnecter")
                    }
                }

                Section {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0").foregroundStyle(AppTheme.Colors.textSecondary)
                    }
                }
            }
            .navigationTitle("Réglages")
            .sheet(isPresented: $showPaywall) {
                PaywallView()
            }
        }
    }
}
