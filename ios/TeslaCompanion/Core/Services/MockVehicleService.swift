import Foundation

/// In-memory implementation used by default so the app is fully browsable
/// (in Previews and the Simulator) without a running backend or a real
/// Tesla account. Swap for `TeslaAPIService` in `AppEnvironment` once the
/// backend is deployed.
final class MockVehicleService: VehicleServicing {
    private var vehicle = Vehicle(
        id: "mock-1",
        displayName: "Mon Model 3",
        vin: "5YJ3E1EA0PF000000",
        model: "Model 3 Performance",
        color: "Blanc Nacré",
        state: .online,
        battery: ChargeState(
            batteryLevel: 78,
            rangeKm: 412,
            chargeLimit: 90,
            isCharging: false,
            chargePowerKw: 0,
            minutesToFull: nil,
            pluggedIn: false
        ),
        climate: ClimateState(isOn: false, insideTempC: 21, outsideTempC: 18, targetTempC: 21, isPreconditioning: false),
        isLocked: true,
        odometerKm: 18240
    )

    func fetchVehicles() async throws -> [Vehicle] {
        try await Task.sleep(nanoseconds: 400_000_000)
        return [vehicle]
    }

    func lock(_ vehicleId: String, locked: Bool) async throws {
        vehicle.isLocked = locked
    }

    func setClimate(_ vehicleId: String, on: Bool, targetTempC: Double) async throws {
        vehicle.climate.isOn = on
        vehicle.climate.targetTempC = targetTempC
    }

    func setChargeLimit(_ vehicleId: String, percent: Int) async throws {
        vehicle.battery.chargeLimit = percent
    }

    func startCharging(_ vehicleId: String) async throws {
        vehicle.battery.isCharging = true
    }

    func stopCharging(_ vehicleId: String) async throws {
        vehicle.battery.isCharging = false
    }

    func flashLights(_ vehicleId: String) async throws {}

    func honkHorn(_ vehicleId: String) async throws {}

    func fetchChargingSessions(vehicleId: String) async throws -> [ChargingSession] {
        let calendar = Calendar.current
        return (0..<6).map { offset in
            ChargingSession(
                id: UUID(),
                date: calendar.date(byAdding: .day, value: -offset * 4, to: .now) ?? .now,
                location: offset % 2 == 0 ? "Domicile" : "Supercharger Paris Est",
                energyAddedKWh: Double.random(in: 12...48),
                cost: Double.random(in: 3...20),
                durationMinutes: Int.random(in: 25...480),
                startBatteryLevel: Int.random(in: 20...50),
                endBatteryLevel: Int.random(in: 70...100)
            )
        }
    }

    func fetchDrivingSessions(vehicleId: String) async throws -> [DrivingSession] {
        let calendar = Calendar.current
        return (0..<14).map { offset in
            DrivingSession(
                id: UUID(),
                date: calendar.date(byAdding: .day, value: -offset, to: .now) ?? .now,
                distanceKm: Double.random(in: 5...80),
                durationMinutes: Int.random(in: 10...90),
                efficiencyWhPerKm: Double.random(in: 140...190),
                averageSpeedKmh: Double.random(in: 25...90)
            )
        }.reversed()
    }

    func fetchMonthlySummary(vehicleId: String) async throws -> MonthlySummary {
        MonthlySummary(month: .now, distanceKm: 842, energyCost: 38.5, co2SavedKg: 156, averageEfficiencyWhPerKm: 162)
    }
}
