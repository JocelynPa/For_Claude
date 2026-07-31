import SwiftUI

@main
struct TeslaCompanionApp: App {
    @StateObject private var environment = AppEnvironment()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(environment)
                .environmentObject(environment.auth)
                // Dark-only by design — a premium, cockpit-style look
                // rather than following the system appearance.
                .preferredColorScheme(.dark)
        }
    }
}
