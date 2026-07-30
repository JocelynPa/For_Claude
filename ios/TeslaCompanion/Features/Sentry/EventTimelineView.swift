import SwiftUI

struct EventTimelineView: View {
    let events: [SentryEvent]
    var onSelect: (SentryEvent) -> Void

    private var groupedByDay: [(day: Date, events: [SentryEvent])] {
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
                    Text(Self.dayLabel(for: group.day))
                        .font(AppFont.caption())
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                        .tracking(0.5)
                        .textCase(.uppercase)

                    VStack(alignment: .leading, spacing: 0) {
                        ForEach(Array(group.events.enumerated()), id: \.element.id) { index, event in
                            TimelineRow(
                                event: event,
                                isLast: index == group.events.count - 1,
                                onSelect: { onSelect(event) }
                            )
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
        formatter.setLocalizedDateFormatFromTemplate("EEEE d MMMM")
        return formatter.string(from: day).capitalized
    }
}

private struct TimelineRow: View {
    let event: SentryEvent
    let isLast: Bool
    let onSelect: () -> Void

    private var dotColor: Color {
        switch event.kind {
        case .sentry: AppTheme.Colors.danger
        case .honk: AppTheme.Colors.warning
        case .dashcamSaved: AppTheme.Colors.accent
        }
    }

    var body: some View {
        Button(action: onSelect) {
            HStack(alignment: .top, spacing: AppSpacing.md) {
                VStack(spacing: 0) {
                    Circle()
                        .fill(dotColor)
                        .frame(width: 10, height: 10)
                        .padding(.top, 6)
                    if !isLast {
                        Rectangle()
                            .fill(AppTheme.Colors.border)
                            .frame(width: 2)
                            .frame(maxHeight: .infinity)
                    }
                }
                .frame(width: 10)

                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: AppSpacing.xs) {
                        Text(event.kind.label)
                            .font(AppFont.body())
                            .foregroundStyle(AppTheme.Colors.textPrimary)
                        if event.isNew {
                            Circle().fill(AppTheme.Colors.accent).frame(width: 6, height: 6)
                        }
                        Spacer()
                        Text(event.date.formatted(date: .omitted, time: .shortened))
                            .font(AppFont.caption())
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                    }
                    HStack(spacing: AppSpacing.xs) {
                        Text(event.location)
                        Text("·")
                        Text("\(event.durationSeconds)s")
                    }
                    .font(AppFont.caption())
                    .foregroundStyle(AppTheme.Colors.textSecondary)
                }
                .padding(.bottom, AppSpacing.md)

                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(AppTheme.Colors.textSecondary)
                    .padding(.top, 2)
            }
        }
        .buttonStyle(.plain)
    }
}
