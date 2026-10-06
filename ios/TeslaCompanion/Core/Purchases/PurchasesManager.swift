import Foundation
import RevenueCat

/// Wraps the RevenueCat SDK: configuration, fetching the paywall's real
/// offerings, purchasing, and restoring. `isPremium` mirrors the "premium"
/// entitlement (⚠️ must exist under that exact identifier in the
/// RevenueCat dashboard, attached to both `premium_monthly` and
/// `premium_yearly`) and is only a client-side UI hint — the backend's own
/// `subscriptionStatus` check (set by the RevenueCat webhook, see
/// backend/src/routes/subscriptions.ts) is the actual enforcement, since a
/// client-side flag can always be bypassed.
///
/// ⚠️ Written against RevenueCat's documented async/await Swift API from
/// memory — no Xcode/compiler available in this environment to verify it
/// against the exact SDK version `project.yml` resolves to. Build once and
/// fix any signature drift before relying on this.
@MainActor
final class PurchasesManager: ObservableObject {
    static let entitlementID = "premium"

    @Published private(set) var isPremium = false
    private var isConfigured = false

    /// Call once at app launch, before any login/purchase call — RevenueCat
    /// requires `configure` to run first and only once per process.
    func configure() {
        guard !isConfigured, !AppConfig.revenueCatAPIKey.isEmpty else { return }
        Purchases.configure(withAPIKey: AppConfig.revenueCatAPIKey)
        isConfigured = true
    }

    /// Aliases the RevenueCat anonymous user to the backend's stable
    /// `User.id` so purchase events reconcile with the right account (see
    /// `AuthManager.userId`). Safe to call repeatedly (e.g. every launch).
    func logIn(userId: String) async {
        guard isConfigured else { return }
        do {
            let result = try await Purchases.shared.logIn(userId)
            updatePremiumStatus(from: result.customerInfo)
        } catch {
            print("RevenueCat logIn failed —", error)
        }
    }

    func logOut() async {
        guard isConfigured else { return }
        _ = try? await Purchases.shared.logOut()
        isPremium = false
    }

    func refreshCustomerInfo() async {
        guard isConfigured else { return }
        do {
            let info = try await Purchases.shared.customerInfo()
            updatePremiumStatus(from: info)
        } catch {
            print("RevenueCat customerInfo fetch failed —", error)
        }
    }

    /// The paywall's two packages, matched by the product identifiers
    /// `SubscriptionPlan` expects (`premium_monthly`/`premium_yearly`) —
    /// nil if offerings haven't loaded or the RevenueCat dashboard's
    /// current offering doesn't contain them yet.
    func fetchOfferedPackages() async throws -> [Package] {
        guard isConfigured else { throw PurchasesManagerError.notConfigured }
        let offerings = try await Purchases.shared.offerings()
        return offerings.current?.availablePackages ?? []
    }

    /// Throws `.cancelled` (not a "real" error) when the user dismisses the
    /// StoreKit sheet themselves — RevenueCat reports that as a successful
    /// call with `userCancelled: true`, not as a thrown error, so it has to
    /// be checked explicitly or a cancelled purchase would look identical
    /// to a completed one to the caller.
    func purchase(_ package: Package) async throws {
        let result = try await Purchases.shared.purchase(package: package)
        if result.userCancelled {
            throw PurchasesManagerError.cancelled
        }
        updatePremiumStatus(from: result.customerInfo)
    }

    func restorePurchases() async throws {
        let info = try await Purchases.shared.restorePurchases()
        updatePremiumStatus(from: info)
    }

    private func updatePremiumStatus(from customerInfo: CustomerInfo) {
        isPremium = customerInfo.entitlements[Self.entitlementID]?.isActive == true
    }
}

enum PurchasesManagerError: LocalizedError {
    case notConfigured
    case cancelled

    var errorDescription: String? {
        switch self {
        case .notConfigured:
            "RevenueCat n'est pas configuré (clé API manquante)."
        case .cancelled:
            nil
        }
    }
}
