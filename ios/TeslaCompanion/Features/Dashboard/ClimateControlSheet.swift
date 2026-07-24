import SwiftUI

struct ClimateControlSheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var environment: AppEnvironment

    let vehicleId: String
    @State private var climate: ClimateState
    var onUpdate: (ClimateState) -> Void

    init(vehicleId: String, climate: ClimateState, onUpdate: @escaping (ClimateState) -> Void) {
        self.vehicleId = vehicleId
        self._climate = State(initialValue: climate)
        self.onUpdate = onUpdate
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: AppSpacing.lg) {
                Text("\(Int(climate.insideTempC))°")
                    .font(.system(size: 56, weight: .bold, design: .rounded))
                    .foregroundStyle(AppTheme.Colors.textPrimary)

                Text("Intérieur · Extérieur \(Int(climate.outsideTempC))°")
                    .font(AppFont.body())
                    .foregroundStyle(AppTheme.Colors.textSecondary)

                Stepper(value: $climate.targetTempC, in: 16...28, step: 0.5) {
                    Text("Consigne : \(climate.targetTempC, specifier: "%.1f")°")
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                }
                .padding(.top, AppSpacing.md)

                PrimaryButton(
                    title: climate.isOn ? "Éteindre la climatisation" : "Démarrer la climatisation",
                    icon: "fan.fill"
                ) {
                    toggleClimate()
                }

                Spacer()
            }
            .padding(AppSpacing.lg)
            .background(AppTheme.Colors.background)
            .navigationTitle("Climatisation")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Fermer") { dismiss() }
                }
            }
        }
    }

    private func toggleClimate() {
        Task {
            try? await environment.vehicleService.setClimate(vehicleId, on: !climate.isOn, targetTempC: climate.targetTempC)
            climate.isOn.toggle()
            onUpdate(climate)
        }
    }
}
