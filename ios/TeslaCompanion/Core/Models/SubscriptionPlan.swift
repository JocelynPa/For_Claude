import Foundation

struct SubscriptionPlan: Identifiable, Hashable {
    let id: String
    let title: String
    let price: String
    let period: String
    let highlight: String?
}

extension SubscriptionPlan {
    static let trialDays = 7

    static let monthly = SubscriptionPlan(
        id: "premium_monthly",
        title: "Mensuel",
        price: "2,99 €",
        period: "/ mois",
        highlight: nil
    )

    static let yearly = SubscriptionPlan(
        id: "premium_yearly",
        title: "Annuel",
        price: "24,99 €",
        period: "/ an",
        highlight: "2 mois offerts"
    )

    /// Everything the app does is already free to use — this list is what
    /// Premium is meant to add once it's actually wired up (RevenueCat SDK
    /// not integrated yet, see README). "Notifications push" in particular
    /// isn't implemented right now (Apple Developer config unavailable —
    /// see git history for `PushNotificationManager`), listed here as the
    /// planned premium perk once it's rebuilt.
    static let allFeatures = [
        "Timeline Sentry en temps réel (Fleet Telemetry)",
        "Action automatique à la détection (klaxon, phares, verrouillage)",
        "Notifications push instantanées",
        "Historique complet des événements"
    ]
}
