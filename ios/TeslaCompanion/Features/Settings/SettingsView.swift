import SwiftUI
import UIKit

struct SettingsView: View {
    @EnvironmentObject private var auth: AuthManager
    @EnvironmentObject private var environment: AppEnvironment
    @State private var showPaywall = false
    @State private var tokenCopied = false
    @State private var sentryAutoAction: SentryAutoAction = .none
    @State private var schedule: SentrySchedule = .default
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
                    Toggle("Alertes Sentinel", isOn: $sentryNotifications)
                }

                Section {
                    Picker("Action automatique", selection: sentryAutoActionBinding) {
                        ForEach(SentryAutoAction.allCases, id: \.self) { action in
                            Text(action.label).tag(action)
                        }
                    }
                } header: {
                    Text("Sentinel")
                } footer: {
                    Text("Déclenchée automatiquement par le serveur dès qu'une activité est détectée, même app fermée.")
                }

                Section {
                    Toggle("Activer selon un horaire", isOn: scheduleEnabledBinding)

                    if schedule.enabled {
                        DatePicker("Début", selection: scheduleStartBinding, displayedComponents: .hourAndMinute)
                        DatePicker("Fin", selection: scheduleEndBinding, displayedComponents: .hourAndMinute)

                        HStack(spacing: AppSpacing.sm) {
                            ForEach(Weekday.allCases) { day in
                                dayToggle(day)
                            }
                        }
                        .padding(.vertical, AppSpacing.xs)
                    }
                } header: {
                    Text("Programmation")
                } footer: {
                    Text("Sentinel s'active et se désactive tout seul sur ce créneau, même app fermée — exécuté côté serveur, pas par le téléphone.")
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
                    Text("Requis pour que la bascule Sentinel et l'action automatique fonctionnent. Ouvre l'app Tesla pour approuver l'appairage.")
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
                    schedule = settings.sentrySchedule
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

    private var scheduleEnabledBinding: Binding<Bool> {
        Binding(
            get: { schedule.enabled },
            set: { newValue in
                schedule.enabled = newValue
                saveSchedule()
            }
        )
    }

    private var scheduleStartBinding: Binding<Date> {
        Binding(
            get: { Self.date(fromHHMM: schedule.start) },
            set: { newValue in
                schedule.start = Self.hhmm(from: newValue)
                saveSchedule()
            }
        )
    }

    private var scheduleEndBinding: Binding<Date> {
        Binding(
            get: { Self.date(fromHHMM: schedule.end) },
            set: { newValue in
                schedule.end = Self.hhmm(from: newValue)
                saveSchedule()
            }
        )
    }

    private func dayToggle(_ day: Weekday) -> some View {
        let isSelected = schedule.days.contains(day.rawValue)
        return Button {
            toggleDay(day)
        } label: {
            Text(day.shortLabel)
                .font(AppFont.caption())
                .fontWeight(.semibold)
                .frame(width: 32, height: 32)
                .foregroundStyle(isSelected ? AppTheme.Colors.background : AppTheme.Colors.textSecondary)
                .background(isSelected ? AppTheme.Colors.accent : AppTheme.Colors.surface)
                .clipShape(Circle())
        }
        .buttonStyle(.plain)
    }

    private func toggleDay(_ day: Weekday) {
        if schedule.days.contains(day.rawValue) {
            // Always keep at least one day selected — an empty schedule
            // would be rejected by the backend anyway.
            guard schedule.days.count > 1 else { return }
            schedule.days.removeAll { $0 == day.rawValue }
        } else {
            schedule.days.append(day.rawValue)
        }
        saveSchedule()
    }

    private func saveSchedule() {
        schedule.timezone = TimeZone.current.identifier
        Task { try? await environment.settingsService.setSentrySchedule(schedule) }
    }

    private static func date(fromHHMM value: String) -> Date {
        let parts = value.split(separator: ":").compactMap { Int($0) }
        var components = DateComponents()
        components.hour = parts.first ?? 0
        components.minute = parts.count > 1 ? parts[1] : 0
        return Calendar.current.date(from: components) ?? .now
    }

    private static func hhmm(from date: Date) -> String {
        let components = Calendar.current.dateComponents([.hour, .minute], from: date)
        return String(format: "%02d:%02d", components.hour ?? 0, components.minute ?? 0)
    }
}
