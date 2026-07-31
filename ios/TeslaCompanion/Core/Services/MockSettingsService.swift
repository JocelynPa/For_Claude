import Foundation

final class MockSettingsService: SettingsServicing {
    private var action: SentryAutoAction = .none

    func fetchSettings() async throws -> AppSettings {
        AppSettings(sentryAutoAction: action)
    }

    func setSentryAutoAction(_ action: SentryAutoAction) async throws {
        self.action = action
    }

    func registerDeviceToken(_ token: String) async throws {}
}
