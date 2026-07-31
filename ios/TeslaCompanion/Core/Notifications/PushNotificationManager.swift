import Foundation
import UIKit
import UserNotifications

/// Requests notification permission, registers for APNs, and forwards the
/// resulting device token to the backend — which sends the actual push when
/// the Fleet Telemetry ingestor detects Sentry activity (see
/// backend/src/services/push.ts). Mirrors the "Alertes Sentry Mode" toggle
/// in Settings (`sentry_notifications_enabled` in UserDefaults).
@MainActor
final class PushNotificationManager: ObservableObject {
    private let client = APIClient.shared
    private let auth: AuthManager

    init(auth: AuthManager) {
        self.auth = auth
        // Block-based observer API rather than the selector-based one: this
        // class doesn't inherit NSObject, which the selector API requires.
        // The closure itself is nonisolated, so the actual MainActor-isolated
        // work happens inside the awaited Task, not synchronously here.
        NotificationCenter.default.addObserver(forName: .didReceiveAPNsDeviceToken, object: nil, queue: .main) { [weak self] notification in
            guard let token = notification.object as? String else { return }
            Task { await self?.registerDeviceToken(token) }
        }
    }

    /// Safe to call repeatedly (e.g. on every launch) — iOS no-ops the
    /// permission prompt once already answered, and registering again just
    /// refreshes the token.
    func requestAuthorizationIfEnabled() {
        guard UserDefaults.standard.object(forKey: "sentry_notifications_enabled") == nil
            || UserDefaults.standard.bool(forKey: "sentry_notifications_enabled") else { return }
        Task {
            let granted = try? await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .sound, .badge])
            if granted == true {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
    }

    private func registerDeviceToken(_ token: String) async {
        guard let body = try? JSONEncoder().encode(["token": token]) else { return }
        try? await client.send(
            Endpoint(path: "settings/device-token", method: "POST", body: body),
            authToken: auth.accessToken
        ) as EmptyResponse
    }
}
