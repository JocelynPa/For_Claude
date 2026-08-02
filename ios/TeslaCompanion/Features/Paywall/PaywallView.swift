import SwiftUI

struct PaywallView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedPlan: SubscriptionPlan = .yearly
    @State private var isPurchasing = false

    private let plans = [SubscriptionPlan.yearly, SubscriptionPlan.monthly]

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

                    HStack(spacing: AppSpacing.sm) {
                        ForEach(plans) { plan in
                            PlanCard(plan: plan, isSelected: plan.id == selectedPlan.id) {
                                selectedPlan = plan
                            }
                        }
                    }

                    PrimaryButton(title: "Continuer", isLoading: isPurchasing) {
                        purchase()
                    }

                    Button("Restaurer mes achats") {}
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
        }
    }

    private func purchase() {
        isPurchasing = true
        Task {
            // Placeholder: wire up RevenueCat's purchase flow here once the SDK is added.
            try? await Task.sleep(nanoseconds: 800_000_000)
            isPurchasing = false
            dismiss()
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
