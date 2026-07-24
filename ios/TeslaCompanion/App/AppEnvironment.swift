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
        auth: AuthManager = AuthManager(),
        vehicleService: VehicleServicing = MockVehicleService(),
        sentryService: SentryServicing = MockSentryService()
    ) {
        self.auth = auth
        self.vehicleService = vehicleService
        self.sentryService = sentryService
    }
}
