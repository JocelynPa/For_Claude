import SwiftUI

struct ClipPlayerView: View {
    @Environment(\.dismiss) private var dismiss
    let event: SentryEvent
    @State private var selectedCamera: SentryCamera
    @State private var scrubPosition: Double = 0

    init(event: SentryEvent) {
        self.event = event
        self._selectedCamera = State(initialValue: event.cameras.first ?? .front)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: AppSpacing.lg) {
                ZStack {
                    RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                        .fill(Color.black)
                    VStack(spacing: AppSpacing.sm) {
                        Image(systemName: "play.circle.fill")
                            .font(.system(size: 44))
                            .foregroundStyle(.white.opacity(0.85))
                        Text("Lecture indisponible en mode démo")
                            .font(AppFont.caption())
                            .foregroundStyle(.white.opacity(0.6))
                    }
                }
                .aspectRatio(16.0 / 9.0, contentMode: .fit)

                if event.cameras.count > 1 {
                    Picker("Caméra", selection: $selectedCamera) {
                        ForEach(event.cameras, id: \.self) { camera in
                            Text(camera.label).tag(camera)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                VStack(alignment: .leading, spacing: AppSpacing.xs) {
                    Slider(value: $scrubPosition, in: 0...Double(max(event.durationSeconds, 1)))
                        .tint(AppTheme.Colors.accent)
                    HStack {
                        Text(timeString(scrubPosition))
                        Spacer()
                        Text(timeString(Double(event.durationSeconds)))
                    }
                    .font(AppFont.caption())
                    .foregroundStyle(AppTheme.Colors.textSecondary)
                }

                HStack(spacing: AppSpacing.lg) {
                    Label("Exporter", systemImage: "square.and.arrow.up")
                        .font(AppFont.body())
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    Spacer()
                    Label("Supprimer", systemImage: "trash")
                        .font(AppFont.body())
                        .foregroundStyle(AppTheme.Colors.danger)
                }

                Spacer()
            }
            .padding(AppSpacing.lg)
            .background(AppTheme.Colors.background)
            .navigationTitle(event.kind.label)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Fermer") { dismiss() }
                }
            }
        }
    }

    private func timeString(_ seconds: Double) -> String {
        let total = Int(seconds)
        return String(format: "%02d:%02d", total / 60, total % 60)
    }
}
