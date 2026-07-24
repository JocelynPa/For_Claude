import Foundation

struct SubscriptionPlan: Identifiable, Hashable {
    let id: String
    let title: String
    let price: String
    let period: String
    let highlight: String?
}

extension SubscriptionPlan {
    static let monthly = SubscriptionPlan(
        id: "premium_monthly",
        title: "Mensuel",
        price: "4,99 €",
        period: "/ mois",
        highlight: nil
    )

    static let yearly = SubscriptionPlan(
        id: "premium_yearly",
        title: "Annuel",
        price: "39,99 €",
        period: "/ an",
        highlight: "2 mois offerts"
    )

    static let allFeatures = [
        "Historique de charge illimité",
        "Statistiques de conduite avancées",
        "Alertes Sentry en temps réel",
        "Stockage cloud des clips (30 jours)",
        "Widgets et Live Activities"
    ]
}
