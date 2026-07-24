import Foundation

/// Simple dependency container injected as a SwiftUI environment object.
/// Defaults to mock services so the app is browsable without a backend;
/// switch `vehicleService`/`sentryService` to the real implementations once
/// the backend is deployed and Tesla Developer credentials are configured.
@MainActor
final class AppEnvironment: ObservableObject {
    let auth: AuthManager
    let vehicleService: VehicleServicing
    let sentryService: SentryServicing

    init(
        auth: AuthManager? = nil,
        vehicleService: VehicleServicing = MockVehicleService(),
        sentryService: SentryServicing = MockSentryService()
    ) {
        // `auth` defaults to nil rather than `AuthManager()` directly: default
        // parameter values are evaluated in a nonisolated context, and
        // AuthManager's initializer is @MainActor-isolated. Constructing it
        // here, inside the body of this @MainActor init, is isolated correctly.
        self.auth = auth ?? AuthManager()
        self.vehicleService = vehicleService
        self.sentryService = sentryService
    }
}
