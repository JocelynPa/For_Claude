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
    let settingsService: SettingsServicing
    let pushManager: PushNotificationManager

    init(
        auth: AuthManager? = nil,
        vehicleService: VehicleServicing? = nil,
        sentryService: SentryServicing? = nil,
        settingsService: SettingsServicing? = nil
    ) {
        // `auth`/`vehicleService`/`sentryService`/`settingsService` default to
        // nil rather than being constructed directly: default parameter
        // values are evaluated in a nonisolated context, and their
        // initializers (or dependencies) are @MainActor-isolated.
        // Constructing them here, inside the body of this @MainActor init,
        // is isolated correctly.
        let resolvedAuth = auth ?? AuthManager()
        self.auth = resolvedAuth
        // Real backend by default now that it's configured; pass an explicit
        // MockVehicleService()/MockSentryService() to fall back to demo data
        // without a backend.
        self.vehicleService = vehicleService ?? TeslaAPIService(auth: resolvedAuth)
        // The Sentry timeline is only populated once Fleet Telemetry is
        // deployed and a vehicle subscribed (see deploy/README.md) — until
        // then this real service just returns an empty list, which is more
        // honest than showing demo data that looks real.
        self.sentryService = sentryService ?? TeslaSentryService(auth: resolvedAuth)
        self.settingsService = settingsService ?? TeslaSettingsService(auth: resolvedAuth)
        self.pushManager = PushNotificationManager(auth: resolvedAuth)
    }
}
