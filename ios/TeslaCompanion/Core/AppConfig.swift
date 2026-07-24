import Foundation

enum AppConfig {
    static let apiBaseURL: String = {
        Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String ?? "https://api.teslacompanion.app"
    }()

    static let teslaOAuthRedirectScheme = "teslacompanion"
}
