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
                        Rectangle()
                            .fill(AppTheme.Colors.border)
                            .frame(height: 1)
                        Text(group.day.formatted(.dateTime.day().month(.abbreviated)))
                    }
                    .font(AppFont.overline())
                    .foregroundStyle(AppTheme.Colors.textSecondary)
                    .tracking(1)
                    .textCase(.uppercase)

                    VStack(alignment: .leading, spacing: AppSpacing.sm) {
                        ForEach(Self.timelineItems(for: group.events)) { item in
                            switch item {
                            case .activity(let entry):
                                ActivityDetectedCard(entry: entry)
                            case .stateGroup(let entries):
                                StateChangeGroupCard(entries: entries)
                            }
                        }
                    }
                }
            }
        }
    }

    /// Consecutive plain state transitions (Sentry Mode activé/désactivé)
    /// are folded into a single grouped card instead of one loose row each —
    /// an activity-detected entry always breaks the run and stands on its
    /// own.
    private static func timelineItems(for entries: [SentryTimelineEntry]) -> [TimelineItem] {
        var items: [TimelineItem] = []
        var run: [SentryTimelineEntry] = []
        for entry in entries {
            if entry.kind == .activityDetected {
                if !run.isEmpty {
                    items.append(.stateGroup(run))
                    run = []
                }
                items.append(.activity(entry))
            } else {
                run.append(entry)
            }
        }
        if !run.isEmpty { items.append(.stateGroup(run)) }
        return items
    }

    private enum TimelineItem: Identifiable {
        case activity(SentryTimelineEntry)
        case stateGroup([SentryTimelineEntry])

        var id: AnyHashable {
            switch self {
            case .activity(let entry): entry.id
            case .stateGroup(let entries): entries.map(\.id)
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

/// A run of plain Sentry Mode activé/désactivé transitions, folded into one
/// quiet card instead of a loose row per entry — keeps the log legible
/// without competing with activity-detected cards for attention.
private struct StateChangeGroupCard: View {
    let entries: [SentryTimelineEntry]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(entries.enumerated()), id: \.element.id) { index, entry in
                HStack(spacing: AppSpacing.sm) {
                    Circle()
                        .fill(entry.kind == .sentryModeEnabled ? AppTheme.Colors.accent : AppTheme.Colors.textSecondary.opacity(0.4))
                        .frame(width: 6, height: 6)
                    Text(entry.kind.label)
                        .font(AppFont.body())
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    if let delta = Self.batteryDelta(at: index, in: entries) {
                        Text(Self.batteryDeltaLabel(delta))
                            .font(AppFont.caption())
                            .fontWeight(.semibold)
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                    }
                    Spacer()
                    Text(entry.date.formatted(date: .omitted, time: .shortened))
                        .font(AppFont.caption())
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                }
                .padding(.vertical, AppSpacing.sm)
                .padding(.horizontal, AppSpacing.md)

                if index < entries.count - 1 {
                    Rectangle()
                        .fill(AppTheme.Colors.hairline)
                        .frame(height: 1)
                        .padding(.leading, AppSpacing.md + 6 + AppSpacing.sm)
                }
            }
        }
        .background(AppTheme.Colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
                .stroke(AppTheme.Colors.hairline, lineWidth: 1)
        )
    }

    /// A `sentryModeDisabled` row paired with the `sentryModeEnabled` entry
    /// right after it (chronologically earlier, since the list is sorted
    /// most-recent-first) closes out one Sentry session — the battery delta
    /// between the two. This is total vehicle consumption during that
    /// window, not draw isolated to Sentry itself (see SentryHomeView's
    /// caveat text).
    private static func batteryDelta(at index: Int, in entries: [SentryTimelineEntry]) -> Int? {
        let entry = entries[index]
        guard entry.kind == .sentryModeDisabled, let disabledLevel = entry.batteryLevelPercent else { return nil }
        guard index + 1 < entries.count else { return nil }
        let next = entries[index + 1]
        guard next.kind == .sentryModeEnabled, let enabledLevel = next.batteryLevelPercent else { return nil }
        return enabledLevel - disabledLevel
    }

    private static func batteryDeltaLabel(_ delta: Int) -> String {
        if delta > 0 { return "· -\(delta) %" }
        if delta < 0 { return "· +\(-delta) %" }
        return "· ±0 %"
    }
}

/// The one entry type worth highlighting: text only (description, awareness
/// level, and whatever action Sentry auto-fired, e.g. a horn) — no image or
/// video, since Tesla exposes neither remotely for any app. Styled as a
/// quiet elevated card with a colored accent edge rather than a full tinted
/// fill, closer to how a premium native app reads.
private struct ActivityDetectedCard: View {
    let entry: SentryTimelineEntry

    /// Panic is Tesla's own escalated alert state — worth the same red used
    /// for the Sentry pulse elsewhere, not just another amber notice.
    private var tint: Color {
        entry.awarenessLevel == .panic ? AppTheme.Colors.danger : AppTheme.Colors.warning
    }

    var body: some View {
        HStack(alignment: .top, spacing: 0) {
            RoundedRectangle(cornerRadius: 2, style: .continuous)
                .fill(tint)
                .frame(width: 3)
                .padding(.vertical, AppSpacing.sm)

            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .top, spacing: AppSpacing.sm) {
                    Image(systemName: entry.awarenessLevel == .panic ? "exclamationmark.triangle.fill" : "eye.fill")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(tint)
                        .frame(width: 22, height: 22)

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
                    Rectangle()
                        .fill(AppTheme.Colors.hairline)
                        .frame(height: 1)
                        .padding(.horizontal, AppSpacing.md)

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
                            .foregroundStyle(tint)
                            .padding(.horizontal, AppSpacing.sm)
                            .padding(.vertical, 4)
                            .overlay(
                                Capsule().stroke(tint.opacity(0.4), lineWidth: 1)
                            )
                        }
                        Spacer()
                    }
                    .padding(.horizontal, AppSpacing.md)
                    .padding(.vertical, AppSpacing.sm)
                }
            }
        }
        .background(AppTheme.Colors.surfaceElevated)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
                .stroke(AppTheme.Colors.hairline, lineWidth: 1)
        )
    }
}
