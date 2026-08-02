import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var auth: AuthManager
    @State private var isSigningIn = false
    @State private var errorMessage: String?

    var body: some View {
        ZStack {
            AppTheme.Colors.background.ignoresSafeArea()

            VStack(spacing: AppSpacing.xl) {
                Spacer()

                VStack(spacing: AppSpacing.md) {
                    Image(systemName: "bolt.car.fill")
                        .font(.system(size: 48, weight: .semibold))
                        .foregroundStyle(AppTheme.Colors.accent)

                    Text("Sentinel Mode")
                        .font(AppFont.largeTitle())
                        .foregroundStyle(AppTheme.Colors.textPrimary)

                    Text("La surveillance Sentry Mode de votre Tesla,\nen temps réel.")
                        .font(AppFont.body())
                        .multilineTextAlignment(.center)
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                }

                Spacer()

                VStack(spacing: AppSpacing.sm) {
                    if let errorMessage {
                        Text(errorMessage)
                            .font(AppFont.caption())
                            .foregroundStyle(AppTheme.Colors.danger)
                    }

                    PrimaryButton(title: "Se connecter avec Tesla", icon: "arrow.right", isLoading: isSigningIn) {
                        signIn()
                    }
                }
                .padding(.horizontal, AppSpacing.lg)
                .padding(.bottom, AppSpacing.xl)
            }
        }
    }

    private func signIn() {
        errorMessage = nil
        isSigningIn = true
        Task {
            do {
                try await auth.signInWithTesla()
            } catch {
                errorMessage = "Connexion impossible. Réessayez."
            }
            isSigningIn = false
        }
    }
}
