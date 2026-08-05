import Foundation

protocol SettingsServicing {
    func fetchSettings() async throws -> AppSettings
    func setSentryAutoAction(_ action: SentryAutoAction) async throws
    func setSentrySchedule(_ schedule: SentrySchedule) async throws
}
