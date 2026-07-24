# Tesla Companion

App iOS native (SwiftUI) qui réunit le contrôle véhicule et les statistiques
façon **TezLab**, et la visionneuse d'événements/clips façon **Sentry Mode
Pro**, dans une interface sobre et élégante (palette graphite/blanc cassé,
accent indigo discret, dark mode adaptatif).

> Ce dépôt repart de zéro : un précédent scaffold en Expo/React Native a été
> retiré. Cette version est un vrai projet iOS natif.

## Structure

```
ios/          Application SwiftUI (projet généré via XcodeGen)
backend/      API Fastify/TypeScript : OAuth Tesla, proxy Fleet API, webhook RevenueCat
```

## Pourquoi un backend ?

Tesla ne permet pas d'échanger le code OAuth directement depuis un client
mobile : le `client_secret` doit rester côté serveur, et les commandes
véhicule (verrouillage, climatisation…) doivent être signées avec une paire
de clés dont la clé publique est hébergée sur un domaine. Le dossier
`backend/` fait ce travail et sert de proxy entre l'app et la Fleet API.

## Démarrer l'app iOS

Prérequis : macOS + Xcode 15+, et [XcodeGen](https://github.com/yonaskolb/XcodeGen)
(`brew install xcodegen`) — le `.xcodeproj` n'est pas commité, il est généré
depuis `ios/project.yml`.

```bash
cd ios
xcodegen generate
open TeslaCompanion.xcodeproj
```

Lancez le run sur simulateur : l'app utilise par défaut des services mock
(`MockVehicleService`, `MockSentryService`, voir `App/AppEnvironment.swift`)
avec un véhicule et des événements Sentry factices, donc **toutes les écrans
sont navigables sans backend ni compte Tesla**. Pour brancher les vraies
données une fois le backend déployé, remplacer les services par défaut dans
`AppEnvironment` par `TeslaAPIService(auth:)`.

⚠️ Ce code a été écrit sans accès à Xcode/macOS dans cet environnement — il
n'a donc pas été compilé ni exécuté. Il suit les API SwiftUI/iOS 17
standards, mais attendez-vous à d'éventuels ajustements mineurs à la première
compilation.

### Fonctionnalités couvertes (v1)

- **Connexion Tesla** via `ASWebAuthenticationSession` (OAuth géré par le backend)
- **Dashboard véhicule** : batterie/autonomie, verrouillage, climatisation
  (avec réglage de consigne), phares, klaxon, limite de charge
- **Statistiques** : résumé mensuel (distance, coût, CO₂ évité), graphique
  d'efficacité (Swift Charts), historique de charge
- **Sentry Mode** : grille des 4 caméras, timeline d'événements (alertes,
  clips sauvegardés, klaxon), lecteur de clip avec sélecteur de caméra et
  scrubber
- **Paywall** premium (plans mensuel/annuel) et **Réglages** (notifications,
  déconnexion)

### Ce qui reste à faire pour une v1 réelle

- Intégrer le SDK RevenueCat pour les achats in-app (le paywall est UI-only)
- Poller `vehicle_data` côté backend pour peupler charge/conduite/Sentry
  réels (Tesla ne fournit pas cet historique nativement, cf.
  `backend/src/routes/vehicles.ts`)
- Flux vidéo Sentry réel (nécessite de lire les clips depuis la clé USB/carte
  du véhicule ou un stockage cloud tiers — hors périmètre Fleet API)
- Vérification du `id_token` Tesla via JWKS côté backend (actuellement décodé
  sans vérification, voir `backend/src/routes/auth.ts`)
- Icône d'app, écran de lancement personnalisé, tests

## Démarrer le backend

Prérequis : Node 20+, Docker (pour Postgres), un compte
[Tesla Developer](https://developer.tesla.com).

```bash
cd backend
cp .env.example .env   # renseigner TESLA_CLIENT_ID/SECRET, JWT_SECRET, etc.
docker compose up -d   # Postgres local
npm install
npm run prisma:migrate
npm run dev
```

Voir `backend/keys/README.md` pour générer la paire de clés Vehicle Command
requise par Tesla (nécessaire pour les commandes signées comme le
verrouillage ou la climatisation).

## Design

Le système de design (`ios/TeslaCompanion/DesignSystem/`) est volontairement
minimal : palette à deux tons (surface/texte) + un seul accent indigo,
composants réutilisables (`Card`, `PrimaryButton`, `StatTile`, `PillBadge`,
`SectionHeader`), pas d'ornementation superflue — l'objectif est un rendu
proche d'une app Apple native plutôt qu'une réplique du rouge Tesla.
