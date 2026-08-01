import Foundation

final class MockSettingsService: SettingsServicing {
    private var action: SentryAutoAction = .none
    private var wheelOptionCode: String?

    func fetchSettings() async throws -> AppSettings {
        AppSettings(sentryAutoAction: action, wheelOptionCode: wheelOptionCode)
    }

    func setSentryAutoAction(_ action: SentryAutoAction) async throws {
        self.action = action
    }

    func setWheelOptionCode(_ code: String?) async throws {
        self.wheelOptionCode = code
    }
}
