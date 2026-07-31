import SwiftUI

struct ChargeCard: View {
    let charge: ChargeState
    var onLimitChange: (Int) async -> Void

    @State private var limit: Double

    init(charge: ChargeState, onLimitChange: @escaping (Int) async -> Void) {
        self.charge = charge
        self.onLimitChange = onLimitChange
        self._limit = State(initialValue: Double(charge.chargeLimit))
    }

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                SectionHeader(title: "Charge")

                HStack {
                    if charge.isCharging {
                        PillBadge(text: "\(Int(charge.chargePowerKw)) kW · en charge", style: .success)
                    } else if charge.pluggedIn {
                        PillBadge(text: "Branché", style: .accent)
                    } else {
                        PillBadge(text: "Débranché", style: .neutral)
                    }
                    Spacer()
                    if let minutes = charge.minutesToFull, charge.isCharging {
                        Text("\(minutes) min restantes")
                            .font(AppFont.caption())
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                    }
                }

                GeometryReader { proxy in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: AppRadius.sm)
                            .fill(AppTheme.Colors.border)
                        RoundedRectangle(cornerRadius: AppRadius.sm)
                            .fill(
                                LinearGradient(
                                    colors: [AppTheme.Colors.accent.opacity(0.75), AppTheme.Colors.accent],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: proxy.size.width * CGFloat(charge.batteryLevel) / 100)
                    }
                }
                .frame(height: 10)

                VStack(alignment: .leading, spacing: AppSpacing.xs) {
                    Text("Limite de charge : \(Int(limit))%")
                        .font(AppFont.body())
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    Slider(value: $limit, in: 50...100, step: 5) { editing in
                        if !editing {
                            Task { await onLimitChange(Int(limit)) }
                        }
                    }
                    .tint(AppTheme.Colors.accent)
                }
            }
        }
    }
}
