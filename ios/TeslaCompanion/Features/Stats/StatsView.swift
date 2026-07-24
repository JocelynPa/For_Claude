import SwiftUI

struct StatsView: View {
    @EnvironmentObject private var environment: AppEnvironment
    @State private var summary: MonthlySummary?
    @State private var drivingSessions: [DrivingSession] = []
    @State private var chargingSessions: [ChargingSession] = []

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppSpacing.lg) {
                    if let summary {
                        MonthlySummaryCard(summary: summary)
                    }

                    Card {
                        VStack(alignment: .leading, spacing: AppSpacing.md) {
                            SectionHeader(title: "Efficacité")
                            EfficiencyChartView(sessions: drivingSessions)
                                .frame(height: 160)
                        }
                    }

                    ChargingHistoryView(sessions: chargingSessions)
                }
                .padding(AppSpacing.md)
            }
            .background(AppTheme.Colors.background)
            .navigationTitle("Statistiques")
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private func load() async {
        guard let vehicleId = try? await environment.vehicleService.fetchVehicles().first?.id else { return }
        async let summaryResult = environment.vehicleService.fetchMonthlySummary(vehicleId: vehicleId)
        async let drivingResult = environment.vehicleService.fetchDrivingSessions(vehicleId: vehicleId)
        async let chargingResult = environment.vehicleService.fetchChargingSessions(vehicleId: vehicleId)
        summary = try? await summaryResult
        drivingSessions = (try? await drivingResult) ?? []
        chargingSessions = (try? await chargingResult) ?? []
    }
}

struct MonthlySummaryCard: View {
    let summary: MonthlySummary

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                SectionHeader(title: "Ce mois-ci")
                HStack(spacing: AppSpacing.lg) {
                    StatTile(value: "\(Int(summary.distanceKm)) km", label: "Parcourus", icon: "road.lanes")
                    StatTile(value: String(format: "%.0f €", summary.energyCost), label: "Coût énergie", icon: "eurosign.circle")
                    StatTile(
                        value: "\(Int(summary.co2SavedKg)) kg",
                        label: "CO₂ évité",
                        icon: "leaf.fill",
                        tint: AppTheme.Colors.success
                    )
                }
            }
        }
    }
}
