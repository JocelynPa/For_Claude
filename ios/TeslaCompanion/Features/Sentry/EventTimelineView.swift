import SwiftUI

struct EventTimelineView: View {
    let events: [SentryTimelineEntry]

    private var groupedByDay: [(day: Date, events: [SentryTimelineEntry])] {
        let calendar = Calendar.current
        let grouped = Dictionary(grouping: events) { calendar.startOfDay(for: $0.date) }
        return grouped.keys.sorted(by: >).map { day in
            (day, grouped[day]!.sorted { $0.date > $1.date })
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.lg) {
            ForEach(groupedByDay, id: \.day) { group in
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    HStack {
                        Text(Self.dayLabel(for: group.day))
                        Spacer()
                        Text(group.day.formatted(.dateTime.day().month(.abbreviated)))
                    }
                    .font(AppFont.caption())
                    .foregroundStyle(AppTheme.Colors.textSecondary)
                    .tracking(0.5)
                    .textCase(.uppercase)

                    VStack(alignment: .leading, spacing: AppSpacing.xs) {
                        ForEach(group.events) { entry in
                            if entry.kind == .activityDetected {
                                ActivityDetectedCard(entry: entry)
                                    .padding(.vertical, AppSpacing.xs)
                            } else {
                                StateChangeRow(entry: entry)
                            }
                        }
                    }
                }
            }
        }
    }

    private static func dayLabel(for day: Date) -> String {
        let calendar = Calendar.current
        if calendar.isDateInToday(day) { return "Aujourd'hui" }
        if calendar.isDateInYesterday(day) { return "Hier" }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "fr_FR")
        formatter.setLocalizedDateFormatFromTemplate("EEEE")
        return formatter.string(from: day).capitalized
    }
}

/// A plain vehicle/Sentry state transition — no card, just a time and label,
/// matching how these entries read in Tesla's own Sentry alert history.
private struct StateChangeRow: View {
    let entry: SentryTimelineEntry

    var body: some View {
        HStack(spacing: AppSpacing.sm) {
            Text(entry.date.formatted(date: .omitted, time: .shortened))
                .font(AppFont.caption())
                .foregroundStyle(AppTheme.Colors.textSecondary)
                .frame(width: 48, alignment: .leading)
            Circle()
                .fill(AppTheme.Colors.textSecondary.opacity(0.5))
                .frame(width: 6, height: 6)
            Text(entry.kind.label)
                .font(AppFont.body())
                .foregroundStyle(AppTheme.Colors.textPrimary)
            Spacer()
        }
        .padding(.vertical, 4)
    }
}

/// The one entry type worth highlighting: text only (description, awareness
/// level, and whatever action Sentry auto-fired, e.g. a horn) — no image or
/// video, since Tesla exposes neither remotely for any app.
private struct ActivityDetectedCard: View {
    let entry: SentryTimelineEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top, spacing: AppSpacing.sm) {
                ZStack {
                    RoundedRectangle(cornerRadius: AppRadius.sm, style: .continuous)
                        .fill(AppTheme.Colors.warning.opacity(0.18))
                    Image(systemName: "eye.fill")
                        .foregroundStyle(AppTheme.Colors.warning)
                }
                .frame(width: 40, height: 40)

                VStack(alignment: .leading, spacing: 2) {
                    Text(entry.kind.label)
                        .font(AppFont.headline())
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    if let description = entry.activityDescription {
                        Text(description + (entry.awarenessLevel.map { " · \($0.label)" } ?? ""))
                            .font(AppFont.caption())
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                    }
                }

                Spacer(minLength: AppSpacing.sm)

                Text(entry.date.formatted(date: .omitted, time: .shortened))
                    .font(AppFont.caption())
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }
            .padding(AppSpacing.md)

            if !entry.firedActions.isEmpty {
                Divider().overlay(AppTheme.Colors.warning.opacity(0.25))

                HStack(spacing: AppSpacing.sm) {
                    Text("DÉCLENCHÉ")
                        .font(AppFont.statLabel())
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                    ForEach(entry.firedActions, id: \.label) { action in
                        HStack(spacing: 4) {
                            Image(systemName: action.systemImage)
                            Text(action.label)
                        }
                        .font(AppFont.caption())
                        .fontWeight(.semibold)
                        .foregroundStyle(AppTheme.Colors.warning)
                        .padding(.horizontal, AppSpacing.sm)
                        .padding(.vertical, 4)
                        .background(AppTheme.Colors.warning.opacity(0.16))
                        .clipShape(Capsule())
                    }
                    Spacer()
                }
                .padding(.horizontal, AppSpacing.md)
                .padding(.vertical, AppSpacing.sm)
            }
        }
        .background(AppTheme.Colors.warning.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
                .stroke(AppTheme.Colors.warning.opacity(0.3), lineWidth: 1)
        )
    }
}
