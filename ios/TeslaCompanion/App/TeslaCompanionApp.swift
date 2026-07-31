import SwiftUI

@main
struct TeslaCompanionApp: App {
    @StateObject private var environment = AppEnvironment()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(environment)
                .environmentObject(environment.auth)
        }
    }
}
