# Tesla Companion

App iOS native (SwiftUI), exclusivement dédiée à **Sentry Mode** : statut en
direct, bascule on/off, journal d'activité en timeline (façon **Sentry Mode
Pro**), action automatique déclenchée par une détection, dans une interface
premium **dark-only** (anthracite profond, accent champagne gold, rouge
Tesla réservé aux alertes) proche du cockpit de l'app Tesla officielle. Le
véhicule affiché est le rendu réel de la voiture du propriétaire (modèle,
couleur, jantes) via l'API compositeur d'images de Tesla, pas une icône
générique.

Le contrôle véhicule complet (verrouillage, climatisation, charge…) et les
statistiques (déjà couverts par l'app Tesla officielle) ont été
volontairement retirés — voir la discussion sur le sujet dans l'historique
git si besoin de les réintroduire.

## Structure

```
ios/          Application SwiftUI (projet généré via XcodeGen)
backend/      API Fastify/TypeScript : OAuth Tesla, proxy Fleet API, ingestion Fleet Telemetry
deploy/       Déploiement Docker Compose (NAS, VPS...) : backend + Postgres + proxy de signature + Fleet Telemetry
```

## Pourquoi un backend ?

Tesla ne permet pas d'échanger le code OAuth directement depuis un client
mobile : le `client_secret` doit rester côté serveur, et les commandes
véhicule signées (bascule Sentry Mode, action automatique) nécessitent une
paire de clés Vehicle Command dont la clé publique est hébergée sur un
domaine. Le dossier `backend/` fait ce travail et sert de proxy entre l'app
et la Fleet API, en plus d'ingérer le flux Fleet Telemetry pour la timeline
Sentry.

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
avec un véhicule et des événements Sentry factices, donc **les deux écrans
sont navigables sans backend ni compte Tesla**. Pour brancher les vraies
données une fois le backend déployé, remplacer les services par défaut dans
`AppEnvironment` par `TeslaAPIService(auth:)`.

⚠️ Ce code a été écrit sans accès à Xcode/macOS dans cet environnement — il
n'a donc pas été compilé ni exécuté. Il suit les API SwiftUI/iOS 17
standards, mais attendez-vous à d'éventuels ajustements mineurs à la première
compilation.

### Fonctionnalités couvertes (v1)

- **Connexion Tesla** via `ASWebAuthenticationSession` (OAuth géré par le backend)
- **Sentry Mode** : statut actif/inactif (pastille rouge animée, données
  réelles via `vehicle_state.sentry_mode`) avec bascule pour
  activer/désactiver directement depuis l'app, journal d'activité en
  timeline (transitions en ligne/hors ligne, Sentry activé/désactivé,
  activité détectée avec niveau Aware/Panic) — texte uniquement, pas
  d'image ni de vidéo. Alimentable en données réelles via **Tesla Fleet
  Telemetry** (le véhicule streame directement son état, voir
  `deploy/README.md` §11) — non activé par défaut, l'onglet est vide tant
  que ce n'est pas configuré
- **Action automatique** configurable (klaxon, phares, verrouillage, ou
  aucune) déclenchée côté serveur à chaque activité détectée — fonctionne
  même app fermée. Voir `deploy/README.md` §12
- **Rendu réel du véhicule** (modèle/couleur/jantes, via l'API compositeur
  d'images Tesla — non-officielle mais publique, utilisée par
  TeslaMate/TeslaFi ; voir `backend/src/services/teslaVehicleImage.ts`)
- **Réglages** : notifications, action Sentry automatique, style de jantes,
  appairage de la clé virtuelle, déconnexion

### Ce qui reste à faire pour une v1 réelle

- La timeline Sentry a sa propre voie réelle (Fleet Telemetry, voir
  `deploy/README.md` §11) mais reste non déployée par défaut ; le champ
  `firedActions` de chaque entrée (ce que **Tesla lui-même** a déclenché,
  ex. alarme native) reste toujours vide — nécessiterait de lire les
  métadonnées `event.json` sur la clé USB du véhicule, hors périmètre pour
  l'instant. Ne pas confondre avec l'action automatique **de l'app**
  (§12 de `deploy/README.md`, ex. klaxon/phares/verrouillage), qui elle
  fonctionne déjà via le même signal Fleet Telemetry
- Le son "pet" (`remote_boombox`) n'est pas proposé comme action —
  `tesla-http-proxy` (le proxy de signature dont dépendent toutes les
  commandes signées) le marque explicitement non implémenté
- Notifications push (APNs) retirées temporairement (config Apple
  Developer non disponible pour l'instant) — le code existait
  (`backend/src/services/push.ts`, `PushNotificationManager`), voir
  l'historique git pour le réintroduire
- Vérification du `id_token` Tesla via JWKS côté backend (actuellement décodé
  sans vérification, voir `backend/src/routes/auth.ts`)
- Icône d'app, écran de lancement personnalisé, tests
- Avant toute diffusion au-delà d'un usage personnel : politique de
  confidentialité/RGPD (l'app traite des données de compte et de véhicule),
  et vérification du statut de l'API compositeur d'images vis-à-vis des
  conditions d'utilisation Tesla Developer (endpoint non documenté
  officiellement)

## Démarrer le backend

Prérequis : Node 20+, une base Postgres locale (via Docker ou installée
nativement, voir ci-dessous), un compte
[Tesla Developer](https://developer.tesla.com).

```bash
cd backend
cp .env.example .env   # renseigner TESLA_CLIENT_ID/SECRET, JWT_SECRET, etc.
```

### Option A — Postgres via Docker

```bash
docker compose up -d
```

### Option B — Postgres natif sur macOS (sans Docker)

```bash
brew install postgresql@16
brew services start postgresql@16
```

Si `psql`/`createdb` ne sont pas dans le PATH après l'installation (paquet
"keg-only") :

```bash
# Apple Silicon
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
# Intel
echo 'export PATH="/usr/local/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc

source ~/.zshrc
```

Créez un rôle et une base identiques aux identifiants par défaut du
`DATABASE_URL` de `.env.example`, pour n'avoir rien d'autre à changer :

```bash
psql postgres -c "CREATE ROLE tesla_companion WITH LOGIN PASSWORD 'tesla_companion' CREATEDB;"
createdb -O tesla_companion tesla_companion
```

Vérifiez la connexion :

```bash
psql "postgresql://tesla_companion:tesla_companion@localhost:5432/tesla_companion" -c "\conninfo"
```

Alternative graphique sans Homebrew : [Postgres.app](https://postgresapp.com)
(démarre un serveur Postgres local depuis la barre de menu ; exécutez les
mêmes commandes `CREATE ROLE`/`createdb` ci-dessus une fois l'app lancée).

### Suite (commune aux deux options)

```bash
npm install
npm run prisma:migrate
npm run dev
```

Voir `backend/keys/README.md` pour générer la paire de clés Vehicle Command
requise par Tesla (nécessaire pour les commandes signées comme la bascule
Sentry Mode).

### Déploiement permanent (au lieu de `npm run dev` + tunnel)

Pour que le backend tourne en continu sans dépendre de votre machine (et
sans ngrok), voir `deploy/README.md` : Docker Compose avec Postgres,
`tesla-http-proxy`, Fleet Telemetry, derrière un vrai domaine via votre
reverse proxy existant (Nginx Proxy Manager) — testé pour un NAS Docker,
portable vers un VPS/AWS.

## Design

Le système de design (`ios/TeslaCompanion/DesignSystem/`) est dark-only,
premium et minimal : palette anthracite/champagne gold/rouge Tesla,
composants réutilisables (`Card`, `PrimaryButton`, `StatTile`, `PillBadge`,
`SectionHeader`), pas d'ornementation superflue.
