import Foundation

struct SubscriptionPlan: Identifiable, Hashable {
    let id: String
    let title: String
    let price: String
    let period: String
    let highlight: String?
}

extension SubscriptionPlan {
    static let trialDays = 14

    static let monthly = SubscriptionPlan(
        id: "premium_monthly",
        title: "Mensuel",
        price: "6,99 €",
        period: "/ mois",
        highlight: nil
    )

    static let yearly = SubscriptionPlan(
        id: "premium_yearly",
        title: "Annuel",
        price: "39,99 €",
        period: "/ an",
        // 39,99 € / an ≈ 3,33 €/mois vs. 6,99 €/mois — environ 6 mois
        // offerts sur les 12.
        highlight: "6 mois offerts"
    )

    /// Everything the app does is already free to use — this list is what
    /// Premium is meant to add once it's actually wired up (RevenueCat SDK
    /// not integrated yet, see README). Push notifications aren't listed
    /// here — they're implemented and free for everyone (see
    /// PushNotificationManager), not a Premium perk.
    static let allFeatures = [
        "Timeline Sentry en temps réel (Fleet Telemetry)",
        "Action automatique à la détection (klaxon, phares, verrouillage)",
        "Historique complet des événements"
    ]
}
