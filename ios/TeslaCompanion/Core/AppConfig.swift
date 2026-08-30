import Foundation

enum AppConfig {
    static let apiBaseURL: String = {
        Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String ?? "https://api.teslacompanion.app"
    }()

    static let teslaOAuthRedirectScheme = "teslacompanion"

    /// Required on the paywall by App Store guideline 3.1.2 for
    /// auto-renewable subscriptions — served by the backend (see
    /// backend/src/routes/legal.ts), not bundled in the app, so they stay
    /// editable without a store release.
    static let termsOfUseURL = URL(string: "\(apiBaseURL)/legal/conditions-generales-utilisation")!
    static let privacyPolicyURL = URL(string: "\(apiBaseURL)/legal/politique-de-confidentialite")!

    /// ⚠️ Not officially documented by Tesla — reverse-engineered/best-effort,
    /// like the virtual key deep link below. Opens the Tesla app in general
    /// (there's no known way to deep link into a specific Sentry clip or
    /// even straight to the Sentry alert list), falling back to the App
    /// Store listing if the scheme doesn't resolve — see
    /// EventTimelineView's activity row tap handler.
    static let teslaAppURLScheme = "tesla://"
    static let teslaAppStoreURL = URL(string: "https://apps.apple.com/app/id582007913")!
}
