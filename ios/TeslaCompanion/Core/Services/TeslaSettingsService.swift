import Foundation

final class TeslaSettingsService: SettingsServicing {
    private let client = APIClient.shared
    private let auth: AuthManager

    init(auth: AuthManager) {
        self.auth = auth
    }

    func fetchSettings() async throws -> AppSettings {
        try await client.send(Endpoint(path: "settings"), authToken: auth.accessToken)
    }

    func setSentryAutoAction(_ action: SentryAutoAction) async throws {
        let body = try JSONEncoder().encode(["sentryAutoAction": action.rawValue])
        try await client.send(
            Endpoint(path: "settings", method: "PATCH", body: body),
            authToken: auth.accessToken
        ) as AppSettings
    }

    func registerDeviceToken(_ token: String) async throws {
        let body = try JSONEncoder().encode(["token": token])
        try await client.send(
            Endpoint(path: "settings/device-token", method: "POST", body: body),
            authToken: auth.accessToken
        ) as EmptyResponse
    }
}
