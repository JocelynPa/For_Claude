import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var environment: AppEnvironment
    @State private var vehicle: Vehicle?
    @State private var isLoading = true
    @State private var loadError: String?
    @State private var showClimateSheet = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppSpacing.lg) {
                    if let vehicle {
                        VehicleHeroCard(vehicle: vehicle)
                        QuickActionsGrid(
                            vehicle: vehicle,
                            onLockToggle: toggleLock,
                            onClimate: { showClimateSheet = true },
                            onFlash: flash,
                            onHonk: honk
                        )
                        ChargeCard(charge: vehicle.battery, onLimitChange: setChargeLimit)
                    } else if isLoading {
                        ProgressView().padding(.top, 80)
                    } else {
                        VStack(spacing: AppSpacing.md) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.system(size: 32))
                                .foregroundStyle(AppTheme.Colors.warning)
                            Text(loadError ?? "Aucun véhicule trouvé sur ce compte.")
                                .font(AppFont.body())
                                .foregroundStyle(AppTheme.Colors.textSecondary)
                                .multilineTextAlignment(.center)
                            Button("Réessayer") {
                                Task { await load() }
                            }
                            .font(AppFont.body())
                            .foregroundStyle(AppTheme.Colors.accent)
                        }
                        .padding(.top, 80)
                        .padding(.horizontal, AppSpacing.lg)
                    }
                }
                .padding(AppSpacing.md)
            }
            .background(AppTheme.Colors.background)
            .navigationTitle(vehicle?.displayName ?? "Véhicule")
            .task { await load() }
            .refreshable { await load() }
            .sheet(isPresented: $showClimateSheet) {
                if let vehicle {
                    ClimateControlSheet(vehicleId: vehicle.id, climate: vehicle.climate) { updated in
                        self.vehicle?.climate = updated
                    }
                }
            }
        }
    }

    private func load() async {
        isLoading = true
        loadError = nil
        do {
            vehicle = try await environment.vehicleService.fetchVehicles().first
        } catch {
            loadError = "Connexion au véhicule impossible : \(error.localizedDescription)"
        }
        isLoading = false
    }

    private func toggleLock() {
        guard let vehicle else { return }
        Task {
            try? await environment.vehicleService.lock(vehicle.id, locked: !vehicle.isLocked)
            self.vehicle?.isLocked.toggle()
        }
    }

    private func flash() {
        guard let vehicle else { return }
        Task { try? await environment.vehicleService.flashLights(vehicle.id) }
    }

    private func honk() {
        guard let vehicle else { return }
        Task { try? await environment.vehicleService.honkHorn(vehicle.id) }
    }

    private func setChargeLimit(_ limit: Int) async {
        guard let vehicle else { return }
        try? await environment.vehicleService.setChargeLimit(vehicle.id, percent: limit)
        self.vehicle?.battery.chargeLimit = limit
    }
}
