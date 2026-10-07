import Foundation
import RevenueCat

// ⚠️ `StoreProductDiscount`/`PaymentMode`/`SubscriptionPeriod` field names
// below are from memory of RevenueCat's documented API, not verified
// against the exact SDK version `project.yml` resolves — no
// Xcode/compiler available here. Build once and fix any signature drift.
struct SubscriptionPlan: Identifiable, Hashable {
    let id: String
    let title: String
    let price: String
    let period: String
    let highlight: String?
    /// Length of the free trial on this specific product, if any — nil
    /// when the product has no introductory free-trial offer configured.
    let trialDays: Int?
    /// Normalized to a per-month cost so plans on different billing periods
    /// (monthly vs. yearly) can be compared — e.g. to compute the yearly
    /// plan's "N mois offerts" badge. Not displayed directly.
    let monthlyEquivalent: Decimal

    static func == (lhs: SubscriptionPlan, rhs: SubscriptionPlan) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

extension SubscriptionPlan {
    /// Built from a real StoreKit product via RevenueCat — price, period,
    /// and trial length all come straight from what's configured in App
    /// Store Connect, rather than being hardcoded here (which drifted out
    /// of sync with the real price more than once before this was wired
    /// up). Returns nil for a non-subscription product or one with no
    /// recognizable billing period — shouldn't happen for `premium_monthly`
    /// / `premium_yearly`, but better to skip a malformed package than
    /// show a nonsensical plan.
    init?(package: Package) {
        let product = package.storeProduct
        guard let period = product.subscriptionPeriod else { return nil }

        self.id = product.productIdentifier
        self.price = product.localizedPriceString
        switch period.unit {
        case .year:
            self.title = "Annuel"
            self.period = "/ an"
        case .month:
            self.title = "Mensuel"
            self.period = "/ mois"
        case .week:
            self.title = "Hebdomadaire"
            self.period = "/ semaine"
        case .day:
            self.title = "Journalier"
            self.period = "/ jour"
        @unknown default:
            self.title = "Abonnement"
            self.period = ""
        }
        self.highlight = nil
        self.monthlyEquivalent = product.price / Self.monthsEquivalent(of: period)

        if let intro = product.introductoryDiscount, intro.paymentMode == .freeTrial {
            self.trialDays = Self.days(for: intro.subscriptionPeriod)
        } else {
            self.trialDays = nil
        }
    }

    /// Returns a copy with a different highlight badge — used once both
    /// plans are loaded to show the yearly plan's savings relative to the
    /// monthly one (see `PaywallView`).
    func withHighlight(_ text: String?) -> SubscriptionPlan {
        SubscriptionPlan(
            id: id,
            title: title,
            price: price,
            period: period,
            highlight: text,
            trialDays: trialDays,
            monthlyEquivalent: monthlyEquivalent
        )
    }

    private static func monthsEquivalent(of period: SubscriptionPeriod) -> Decimal {
        switch period.unit {
        case .year: Decimal(period.value) * 12
        case .month: Decimal(period.value)
        case .week: Decimal(period.value) * 7 / 30.44
        case .day: Decimal(period.value) / 30.44
        @unknown default: Decimal(period.value)
        }
    }

    private static func days(for period: SubscriptionPeriod) -> Int {
        switch period.unit {
        case .year: period.value * 365
        case .month: period.value * 30
        case .week: period.value * 7
        case .day: period.value
        @unknown default: period.value
        }
    }

    /// Everything the app does is already free to use — this list is what
    /// Premium adds, now actually enforced server-side (see
    /// backend/src/routes/settings.ts and vehicles.ts). Push notifications
    /// aren't listed here — they're implemented and free for everyone (see
    /// PushNotificationManager), not a Premium perk.
    static let allFeatures = [
        "Timeline Sentry en temps réel (Fleet Telemetry)",
        "Action automatique à la détection (klaxon, phares, verrouillage)",
        "Historique complet des événements"
    ]
}
