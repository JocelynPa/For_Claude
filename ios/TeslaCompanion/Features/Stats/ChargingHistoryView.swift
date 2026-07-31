import SwiftUI

struct ChargingHistoryView: View {
    let sessions: [ChargingSession]

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                SectionHeader(title: "Historique de charge")

                if sessions.isEmpty {
                    Text("Aucune session de charge récente.")
                        .font(AppFont.body())
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                } else {
                    VStack(spacing: AppSpacing.sm) {
                        ForEach(sessions) { session in
                            ChargingSessionRow(session: session)
                            if session.id != sessions.last?.id {
                                Divider().overlay(AppTheme.Colors.border)
                            }
                        }
                    }
                }
            }
        }
    }
}

private struct ChargingSessionRow: View {
    let session: ChargingSession

    private var isSupercharger: Bool {
        session.location.localizedCaseInsensitiveContains("supercharger")
    }

    var body: some View {
        HStack(spacing: AppSpacing.sm) {
            ZStack {
                Circle().fill(AppTheme.Colors.accent.opacity(0.14))
                Image(systemName: isSupercharger ? "bolt.fill" : "house.fill")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(AppTheme.Colors.accent)
            }
            .frame(width: 32, height: 32)

            VStack(alignment: .leading, spacing: 2) {
                Text(session.location)
                    .font(AppFont.body())
                    .foregroundStyle(AppTheme.Colors.textPrimary)
                Text(session.date.formatted(date: .abbreviated, time: .shortened))
                    .font(AppFont.caption())
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text(String(format: "%.1f kWh", session.energyAddedKWh))
                    .font(AppFont.body())
                    .foregroundStyle(AppTheme.Colors.textPrimary)
                Text(String(format: "%.2f €", session.cost))
                    .font(AppFont.caption())
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }
        }
        .padding(.vertical, AppSpacing.xs)
    }
}
