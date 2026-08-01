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

    func setWheelOptionCode(_ code: String?) async throws {
        let body = try JSONEncoder().encode(WheelOptionCodeBody(wheelOptionCode: code))
        try await client.send(
            Endpoint(path: "settings", method: "PATCH", body: body),
            authToken: auth.accessToken
        ) as AppSettings
    }
}

private struct WheelOptionCodeBody: Encodable {
    let wheelOptionCode: String?
}
