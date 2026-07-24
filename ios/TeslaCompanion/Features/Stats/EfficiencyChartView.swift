import SwiftUI
import Charts

struct EfficiencyChartView: View {
    let sessions: [DrivingSession]

    var body: some View {
        if sessions.isEmpty {
            Text("Pas encore de trajets enregistrés.")
                .font(AppFont.body())
                .foregroundStyle(AppTheme.Colors.textSecondary)
        } else {
            Chart(sessions.suffix(14)) { session in
                LineMark(
                    x: .value("Date", session.date, unit: .day),
                    y: .value("Wh/km", session.efficiencyWhPerKm)
                )
                .foregroundStyle(AppTheme.Colors.accent)
                .interpolationMethod(.catmullRom)

                AreaMark(
                    x: .value("Date", session.date, unit: .day),
                    y: .value("Wh/km", session.efficiencyWhPerKm)
                )
                .foregroundStyle(AppTheme.Colors.accent.opacity(0.12))
                .interpolationMethod(.catmullRom)
            }
            .chartYAxis {
                AxisMarks(position: .leading)
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 3))
            }
        }
    }
}
