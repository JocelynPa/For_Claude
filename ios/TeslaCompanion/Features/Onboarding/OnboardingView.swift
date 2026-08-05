import SwiftUI

/// Shown once, before the first login (see RootView — gated behind an
/// AppStorage flag) so a new owner sees what the app actually does before
/// being asked to connect their Tesla account.
struct OnboardingView: View {
    let onFinish: () -> Void
    @State private var page = 0

    private struct Slide {
        let icon: String
        let title: String
        let description: String
    }

    private let slides: [Slide] = [
        Slide(
            icon: "shield.lefthalf.filled",
            title: "Sentinel Mode",
            description: "La surveillance Sentry de votre Tesla, repensée : statut en direct, historique clair, rien d'autre à faire."
        ),
        Slide(
            icon: "eye.fill",
            title: "Surveillance en temps réel",
            description: "Chaque activité détectée apparaît instantanément dans une timeline claire — touchez-la pour revoir l'enregistrement dans l'app Tesla."
        ),
        Slide(
            icon: "bolt.horizontal.fill",
            title: "Action automatique",
            description: "Klaxon, phares ou verrouillage déclenchés tout seuls dès qu'une activité est détectée — même app fermée."
        ),
        Slide(
            icon: "clock.fill",
            title: "Programmation horaire",
            description: "Sentinel s'active et se désactive automatiquement sur le créneau de votre choix, même téléphone éteint."
        ),
    ]

    var body: some View {
        ZStack {
            AppTheme.Colors.background.ignoresSafeArea()

            VStack(spacing: AppSpacing.xl) {
                Spacer()

                TabView(selection: $page) {
                    ForEach(Array(slides.enumerated()), id: \.offset) { index, slide in
                        slideView(slide).tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .frame(height: 360)

                HStack(spacing: AppSpacing.xs) {
                    ForEach(slides.indices, id: \.self) { index in
                        Capsule()
                            .fill(index == page ? AppTheme.Colors.accent : AppTheme.Colors.border)
                            .frame(width: index == page ? 20 : 6, height: 6)
                    }
                }
                .animation(.easeInOut(duration: 0.25), value: page)

                Spacer()

                VStack(spacing: AppSpacing.sm) {
                    PrimaryButton(title: page == slides.count - 1 ? "Commencer" : "Suivant") {
                        if page == slides.count - 1 {
                            onFinish()
                        } else {
                            withAnimation { page += 1 }
                        }
                    }

                    if page < slides.count - 1 {
                        Button("Passer") { onFinish() }
                            .font(AppFont.caption())
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                    }
                }
                .padding(.horizontal, AppSpacing.lg)
                .padding(.bottom, AppSpacing.lg)
            }
        }
    }

    private func slideView(_ slide: Slide) -> some View {
        VStack(spacing: AppSpacing.lg) {
            ZStack {
                RadialGradient(
                    colors: [AppTheme.Colors.accent.opacity(0.18), .clear],
                    center: .center,
                    startRadius: 4,
                    endRadius: 90
                )
                Image(systemName: slide.icon)
                    .font(.system(size: 48, weight: .semibold))
                    .foregroundStyle(AppTheme.Colors.accent)
            }
            .frame(width: 140, height: 140)

            VStack(spacing: AppSpacing.sm) {
                Text(slide.title)
                    .font(AppFont.largeTitle())
                    .multilineTextAlignment(.center)
                    .foregroundStyle(AppTheme.Colors.textPrimary)
                Text(slide.description)
                    .font(AppFont.body())
                    .multilineTextAlignment(.center)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
                    .padding(.horizontal, AppSpacing.lg)
            }
        }
        .padding(.horizontal, AppSpacing.md)
    }
}
