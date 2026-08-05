import Foundation

final class MockSettingsService: SettingsServicing {
    private var action: SentryAutoAction = .none
    private var schedule: SentrySchedule = .default

    func fetchSettings() async throws -> AppSettings {
        AppSettings(sentryAutoAction: action, sentrySchedule: schedule)
    }

    func setSentryAutoAction(_ action: SentryAutoAction) async throws {
        self.action = action
    }

    func setSentrySchedule(_ schedule: SentrySchedule) async throws {
        self.schedule = schedule
    }
}
