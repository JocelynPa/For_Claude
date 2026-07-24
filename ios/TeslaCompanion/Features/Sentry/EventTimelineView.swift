import SwiftUI

struct EventTimelineView: View {
    let events: [SentryEvent]
    var onSelect: (SentryEvent) -> Void

    var body: some View {
        VStack(spacing: AppSpacing.sm) {
            ForEach(events) { event in
                Button { onSelect(event) } label: {
                    EventRow(event: event)
                }
                .buttonStyle(.plain)
                if event.id != events.last?.id {
                    Divider().overlay(AppTheme.Colors.border)
                }
            }
        }
    }
}

struct EventRow: View {
    let event: SentryEvent

    var body: some View {
        HStack(spacing: AppSpacing.md) {
            ZStack {
                RoundedRectangle(cornerRadius: AppRadius.sm, style: .continuous)
                    .fill(AppTheme.Colors.surfaceElevated)
                    .frame(width: 56, height: 56)
                Image(systemName: event.thumbnailSystemImage)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: AppSpacing.xs) {
                    Text(event.kind.label)
                        .font(AppFont.body())
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    if event.isNew {
                        Circle().fill(AppTheme.Colors.accent).frame(width: 6, height: 6)
                    }
                }
                Text("\(event.location) · \(event.date.formatted(date: .abbreviated, time: .shortened))")
                    .font(AppFont.caption())
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }

            Spacer()

            Text("\(event.durationSeconds)s")
                .font(AppFont.caption())
                .foregroundStyle(AppTheme.Colors.textSecondary)

            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(AppTheme.Colors.textSecondary)
        }
        .padding(.vertical, AppSpacing.xs)
    }
}
