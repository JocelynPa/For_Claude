import Foundation

protocol SettingsServicing {
    func fetchSettings() async throws -> AppSettings
    func setSentryAutoAction(_ action: SentryAutoAction) async throws
    func registerDeviceToken(_ token: String) async throws
}
