import SwiftUI
import UIKit

struct SettingsView: View {
    @EnvironmentObject private var auth: AuthManager
    @EnvironmentObject private var environment: AppEnvironment
    @State private var showPaywall = false
    @State private var tokenCopied = false
    @State private var sentryAutoAction: SentryAutoAction = .none
    @State private var wheelStyle: WheelStyle = .defaultWheels
    @AppStorage("sentry_notifications_enabled") private var sentryNotifications = true

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
                }

                Section {
                    Picker("Action automatique", selection: sentryAutoActionBinding) {
                        ForEach(SentryAutoAction.allCases, id: \.self) { action in
                            Text(action.label).tag(action)
                        }
                    }
                } header: {
                    Text("Sentry Mode")
                } footer: {
                    Text("Déclenchée automatiquement par le serveur dès qu'une activité est détectée, même app fermée.")
                }

                Section {
                    Picker("Jantes", selection: wheelStyleBinding) {
                        ForEach(WheelStyle.allCases) { style in
                            Text(style.label).tag(style)
                        }
                    }
                } header: {
                    Text("Véhicule")
                } footer: {
                    Text("Tesla ne fournit plus les jantes réelles via l'API — à définir manuellement pour que la photo du véhicule les affiche correctement.")
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
                    Text("Requis pour que la bascule Sentry Mode et l'action automatique fonctionnent. Ouvre l'app Tesla pour approuver l'appairage.")
                }

                Section("Compte") {
                    Button(role: .destructive) {
                        auth.signOut()
                    } label: {
                        Text("Se déconnecter")
                    }
                }

                Section {
                    Button {
                        guard let token = auth.accessToken else { return }
                        UIPasteboard.general.string = token
                        tokenCopied = true
                    } label: {
                        HStack {
                            Image(systemName: tokenCopied ? "checkmark" : "doc.on.doc")
                                .foregroundStyle(AppTheme.Colors.accent)
                            Text(tokenCopied ? "Token copié" : "Copier le token de session")
                                .foregroundStyle(AppTheme.Colors.textPrimary)
                        }
                    }
                } header: {
                    Text("Développeur")
                } footer: {
                    Text("Pour tester l'API backend directement (ex. curl). À retirer avant publication sur l'App Store.")
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
            .task {
                if let settings = try? await environment.settingsService.fetchSettings() {
                    sentryAutoAction = settings.sentryAutoAction
                    wheelStyle = WheelStyle(optionCode: settings.wheelOptionCode)
                }
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

    private var sentryAutoActionBinding: Binding<SentryAutoAction> {
        Binding(
            get: { sentryAutoAction },
            set: { newValue in
                sentryAutoAction = newValue
                Task { try? await environment.settingsService.setSentryAutoAction(newValue) }
            }
        )
    }

    private var wheelStyleBinding: Binding<WheelStyle> {
        Binding(
            get: { wheelStyle },
            set: { newValue in
                wheelStyle = newValue
                Task { try? await environment.settingsService.setWheelOptionCode(newValue.optionCode) }
            }
        )
    }
}
