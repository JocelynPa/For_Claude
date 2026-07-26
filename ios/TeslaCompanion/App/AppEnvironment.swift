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
        vehicleService: VehicleServicing? = nil,
        sentryService: SentryServicing = MockSentryService()
    ) {
        // `auth`/`vehicleService` default to nil rather than being constructed
        // directly: default parameter values are evaluated in a nonisolated
        // context, and both AuthManager's initializer and TeslaAPIService's
        // dependency on it are @MainActor-isolated. Constructing them here,
        // inside the body of this @MainActor init, is isolated correctly.
        let resolvedAuth = auth ?? AuthManager()
        self.auth = resolvedAuth
        // Real backend by default now that it's configured; pass an explicit
        // MockVehicleService() to fall back to demo data without a backend.
        self.vehicleService = vehicleService ?? TeslaAPIService(auth: resolvedAuth)
        // Sentry clip/event history isn't populated by the backend yet (see
        // README), so it stays mock until that poller exists.
        self.sentryService = sentryService
    }
}
