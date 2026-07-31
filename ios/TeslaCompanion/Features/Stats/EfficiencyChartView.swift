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
                .lineStyle(StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round))
                .interpolationMethod(.catmullRom)

                AreaMark(
                    x: .value("Date", session.date, unit: .day),
                    y: .value("Wh/km", session.efficiencyWhPerKm)
                )
                .foregroundStyle(
                    LinearGradient(
                        colors: [AppTheme.Colors.accent.opacity(0.25), AppTheme.Colors.accent.opacity(0)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .interpolationMethod(.catmullRom)

                PointMark(
                    x: .value("Date", session.date, unit: .day),
                    y: .value("Wh/km", session.efficiencyWhPerKm)
                )
                .foregroundStyle(AppTheme.Colors.accent)
                .symbolSize(22)
            }
            .chartYAxis {
                AxisMarks(position: .leading) {
                    AxisGridLine().foregroundStyle(AppTheme.Colors.border)
                    AxisValueLabel().foregroundStyle(AppTheme.Colors.textSecondary)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 3)) {
                    AxisGridLine().foregroundStyle(AppTheme.Colors.border)
                    AxisValueLabel().foregroundStyle(AppTheme.Colors.textSecondary)
                }
            }
        }
    }
}
