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

                Section {
                    if let addVirtualKeyURL {
                        Link(destination: addVirtualKeyURL) {
                            HStack {
                                Image(systemName: "key.fill").foregroundStyle(AppTheme.Colors.accent)
                                Text("Ajouter la clé virtuelle")
                                    .foregroundStyle(AppTheme.Colors.textPrimary)
                                Spacer()
                                Image(systemName: "arrow.up.right")
                                    .font(.caption)
                                    .foregroundStyle(AppTheme.Colors.textSecondary)
                            }
                        }
                    }
                } header: {
                    Text("Sécurité")
                } footer: {
                    Text("Requis pour que les commandes (verrouillage, climatisation…) fonctionnent. Ouvre l'app Tesla pour approuver l'appairage.")
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

    /// Deep link Tesla documents as the reliable way to trigger the virtual
    /// key pairing prompt in the owner's Tesla app — waiting for it to
    /// appear automatically on the first signed command is unreliable.
    private var addVirtualKeyURL: URL? {
        guard let host = URL(string: AppConfig.apiBaseURL)?.host else { return nil }
        return URL(string: "https://tesla.com/_ak/\(host)")
    }
}
