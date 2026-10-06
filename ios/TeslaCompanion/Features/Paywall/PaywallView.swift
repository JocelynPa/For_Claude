import SwiftUI
import RevenueCat

struct PaywallView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var environment: AppEnvironment

    @State private var plans: [SubscriptionPlan] = []
    @State private var packagesByPlanId: [String: Package] = [:]
    @State private var selectedPlanId: String?
    @State private var isLoadingOfferings = true
    @State private var loadError: String?
    @State private var isPurchasing = false
    @State private var restoreMessage: String?

    private var selectedPlan: SubscriptionPlan? {
        plans.first { $0.id == selectedPlanId }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppSpacing.lg) {
                    VStack(spacing: AppSpacing.sm) {
                        Image(systemName: "shield.lefthalf.filled")
                            .font(.system(size: 36))
                            .foregroundStyle(AppTheme.Colors.accent)
                        Text("Passez à Premium")
                            .font(AppFont.largeTitle())
                            .foregroundStyle(AppTheme.Colors.textPrimary)
                        Text("Débloquez la surveillance Sentry en temps réel.")
                            .font(AppFont.body())
                            .multilineTextAlignment(.center)
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                        if let trialDays = selectedPlan?.trialDays {
                            PillBadge(text: "\(trialDays) jours d'essai gratuit", style: .accent)
                        }
                    }
                    .padding(.top, AppSpacing.md)

                    VStack(alignment: .leading, spacing: AppSpacing.sm) {
                        ForEach(SubscriptionPlan.allFeatures, id: \.self) { feature in
                            HStack(spacing: AppSpacing.sm) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(AppTheme.Colors.success)
                                Text(feature)
                                    .font(AppFont.body())
                                    .foregroundStyle(AppTheme.Colors.textPrimary)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    if isLoadingOfferings {
                        ProgressView().padding(.vertical, AppSpacing.lg)
                    } else if plans.isEmpty {
                        Text("Offres indisponibles pour le moment (\(loadError ?? "aucune offre configurée")).")
                            .font(AppFont.caption())
                            .multilineTextAlignment(.center)
                            .foregroundStyle(AppTheme.Colors.danger)
                    } else {
                        HStack(spacing: AppSpacing.sm) {
                            ForEach(plans) { plan in
                                PlanCard(plan: plan, isSelected: plan.id == selectedPlanId) {
                                    selectedPlanId = plan.id
                                }
                            }
                        }

                        PrimaryButton(
                            title: selectedPlan?.trialDays.map { "Essayer \($0) jours gratuitement" } ?? "S'abonner",
                            isLoading: isPurchasing
                        ) {
                            purchase()
                        }
                        .disabled(selectedPlan == nil)

                        if let selectedPlan {
                            Text(
                                selectedPlan.trialDays != nil
                                    ? "Puis \(selectedPlan.price)\(selectedPlan.period). Résiliable à tout moment avant la fin de l'essai, sans engagement."
                                    : "\(selectedPlan.price)\(selectedPlan.period), renouvelé automatiquement. Résiliable à tout moment."
                            )
                            .font(AppFont.caption())
                            .multilineTextAlignment(.center)
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                        }
                    }

                    if let loadError, !plans.isEmpty {
                        Text(loadError)
                            .font(AppFont.caption())
                            .foregroundStyle(AppTheme.Colors.danger)
                    }

                    VStack(spacing: 4) {
                        Button("Restaurer mes achats") { restore() }
                            .font(AppFont.caption())
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                        if let restoreMessage {
                            Text(restoreMessage)
                                .font(AppFont.caption())
                                .foregroundStyle(AppTheme.Colors.textSecondary)
                        }
                    }

                    // Required by App Store guideline 3.1.2 for
                    // auto-renewable subscriptions: functional links to the
                    // terms of use and privacy policy, visible on the
                    // purchase screen itself, not just buried in Settings.
                    HStack(spacing: AppSpacing.md) {
                        Link("Conditions d'utilisation", destination: AppConfig.termsOfUseURL)
                        Link("Confidentialité", destination: AppConfig.privacyPolicyURL)
                    }
                    .font(AppFont.caption())
                    .foregroundStyle(AppTheme.Colors.textSecondary)
                }
                .padding(AppSpacing.lg)
            }
            .background(AppTheme.Colors.background)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Fermer") { dismiss() }
                }
            }
            .task { await loadOfferings() }
        }
    }

    private func loadOfferings() async {
        isLoadingOfferings = true
        loadError = nil
        do {
            let packages = try await environment.purchasesManager.fetchOfferedPackages()
            var builtPlans: [SubscriptionPlan] = []
            var mapping: [String: Package] = [:]
            for package in packages {
                guard let plan = SubscriptionPlan(package: package) else { continue }
                builtPlans.append(plan)
                mapping[plan.id] = package
            }

            // Yearly plan's savings badge, computed against the monthly
            // plan's price rather than hardcoded — see SubscriptionPlan.
            if let monthlyIndex = builtPlans.firstIndex(where: { $0.period == "/ mois" }),
               let yearlyIndex = builtPlans.firstIndex(where: { $0.period == "/ an" }) {
                let monthly = builtPlans[monthlyIndex]
                let yearly = builtPlans[yearlyIndex]
                if monthly.monthlyEquivalent > 0, yearly.monthlyEquivalent < monthly.monthlyEquivalent {
                    let savedMonths = NSDecimalNumber(
                        decimal: 12 * (1 - yearly.monthlyEquivalent / monthly.monthlyEquivalent)
                    ).intValue
                    if savedMonths > 0 {
                        builtPlans[yearlyIndex] = yearly.withHighlight("\(savedMonths) mois offerts")
                    }
                }
            }

            // Yearly shown first, matching the previous static ordering.
            builtPlans.sort { ($0.period == "/ an" ? 0 : 1) < ($1.period == "/ an" ? 0 : 1) }

            packagesByPlanId = mapping
            plans = builtPlans
            selectedPlanId = builtPlans.first?.id
        } catch {
            loadError = error.localizedDescription
        }
        isLoadingOfferings = false
    }

    private func purchase() {
        guard let selectedPlanId, let package = packagesByPlanId[selectedPlanId] else { return }
        isPurchasing = true
        Task {
            do {
                try await environment.purchasesManager.purchase(package)
                isPurchasing = false
                dismiss()
            } catch PurchasesManagerError.cancelled {
                isPurchasing = false
            } catch {
                isPurchasing = false
                loadError = error.localizedDescription
            }
        }
    }

    private func restore() {
        Task {
            do {
                try await environment.purchasesManager.restorePurchases()
                if environment.purchasesManager.isPremium {
                    dismiss()
                } else {
                    restoreMessage = "Aucun abonnement actif trouvé pour ce compte."
                }
            } catch {
                restoreMessage = error.localizedDescription
            }
        }
    }
}

struct PlanCard: View {
    let plan: SubscriptionPlan
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                if let highlight = plan.highlight {
                    PillBadge(text: highlight, style: .accent)
                }
                Text(plan.title)
                    .font(AppFont.headline())
                    .foregroundStyle(AppTheme.Colors.textPrimary)
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text(plan.price)
                        .font(AppFont.statValue())
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    Text(plan.period)
                        .font(AppFont.caption())
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                }
                if plan.trialDays != nil {
                    Text("après l'essai gratuit")
                        .font(AppFont.caption())
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(AppSpacing.md)
            .background(isSelected ? AppTheme.Colors.accent.opacity(0.12) : AppTheme.Colors.surface)
            .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
                    .stroke(isSelected ? AppTheme.Colors.accent : AppTheme.Colors.border, lineWidth: isSelected ? 2 : 1)
            )
        }
        .buttonStyle(.plain)
    }
}
