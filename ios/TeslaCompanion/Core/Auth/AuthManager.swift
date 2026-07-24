import Foundation
import AuthenticationServices
import UIKit

/// Drives the Tesla sign-in flow through the backend (`/auth/tesla/start`),
/// which redirects to Tesla's login page and, on success, redirects back to
/// this app via the `teslacompanion://auth` custom URL scheme carrying a
/// short-lived app session token. The token is stored in the Keychain.
@MainActor
final class AuthManager: NSObject, ObservableObject {
    @Published private(set) var isAuthenticated: Bool
    @Published private(set) var currentUser: AppUser?

    private let tokenKey = "tesla_companion_access_token"
    private var webAuthSession: ASWebAuthenticationSession?

    override init() {
        self.isAuthenticated = KeychainStore.read(tokenKey) != nil
        super.init()
    }

    var accessToken: String? {
        KeychainStore.read(tokenKey)
    }

    func signInWithTesla() async throws {
        guard let url = URL(string: "\(AppConfig.apiBaseURL)/auth/tesla/start") else {
            throw APIError.invalidURL
        }

        let callback: URL = try await withCheckedThrowingContinuation { continuation in
            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: AppConfig.teslaOAuthRedirectScheme
            ) { callbackURL, error in
                if let callbackURL {
                    continuation.resume(returning: callbackURL)
                } else {
                    continuation.resume(throwing: error ?? URLError(.unknown))
                }
            }
            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = true
            self.webAuthSession = session
            session.start()
        }

        guard let token = URLComponents(url: callback, resolvingAgainstBaseURL: false)?
            .queryItems?.first(where: { $0.name == "access_token" })?.value else {
            throw APIError.unauthorized
        }

        KeychainStore.save(token, for: tokenKey)
        isAuthenticated = true
    }

    func signOut() {
        KeychainStore.delete(tokenKey)
        isAuthenticated = false
        currentUser = nil
    }
}

extension AuthManager: ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }
}
