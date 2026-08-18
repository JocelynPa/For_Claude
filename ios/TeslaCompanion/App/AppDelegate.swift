import UIKit

extension Notification.Name {
    static let didReceiveAPNsDeviceToken = Notification.Name("didReceiveAPNsDeviceToken")
}

/// Bridges UIKit's remote-notification registration callbacks into the
/// SwiftUI app via `@UIApplicationDelegateAdaptor` — SwiftUI's `App`
/// protocol has no equivalent hook for these.
final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02x", $0) }.joined()
        NotificationCenter.default.post(name: .didReceiveAPNsDeviceToken, object: token)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Failed to register for remote notifications: \(error)")
    }
}
