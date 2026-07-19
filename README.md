# Tesla Companion

Application mobile (iOS puis Android) permettant de contrôler à distance un véhicule Tesla
(verrouillage, climatisation, charge) et de consulter des statistiques de conduite, avec un
abonnement premium récurrent via RevenueCat.

## Architecture

```
mobile/   Expo (React Native + expo-router) — client léger, aucune donnée sensible stockée
backend/  Fastify + Prisma/Postgres — détient les tokens OAuth Tesla, proxy la Fleet API,
          reçoit les webhooks RevenueCat
```

L'app mobile ne parle **jamais** directement à l'API Tesla : elle passe systématiquement par
notre backend, qui seul détient les refresh tokens et signe les commandes véhicule. C'est une
contrainte de sécurité, pas un choix arbitraire — voir ci-dessous.

```
[App iOS/Android] --HTTPS (JWT session)--> [Backend Fastify] --OAuth token--> [Tesla Fleet API] (lecture)
                                                  |
                                                  +--HTTP mTLS--> [tesla-http-proxy sidecar] --> Vehicle Command (signé)
                                                  |
                                                  +--webhook--> [RevenueCat] (statut abonnement)
```

## Pourquoi un backend est obligatoire

1. **Tokens OAuth Tesla** : le refresh token ne doit jamais résider sur l'appareil de
   l'utilisateur (voir `backend/prisma/schema.prisma`, modèle `TeslaCredential`).
2. **Commandes véhicule signées** : depuis 2023, Tesla exige que les commandes (verrouillage,
   climatisation, charge...) soient signées via le **Vehicle Command Protocol**, pas de simple
   appel REST. Cela passe par le binaire officiel `tesla-http-proxy`
   ([teslamotors/vehicle-command](https://github.com/teslamotors/vehicle-command)) exécuté comme
   sidecar sur votre serveur, détenteur de la clé privée. Voir `backend/keys/README.md`.
3. **Clé publique hébergée sur votre domaine** : Tesla va chercher
   `https://votre-domaine.com/.well-known/appspecific/com.tesla.3p.public-key.pem` pour valider
   les commandes signées (`backend/src/routes/wellKnown.ts`).
4. **Validation des reçus d'abonnement côté serveur** : RevenueCat notifie le backend par webhook
   (`backend/src/routes/subscriptions.ts`) pour éviter qu'un utilisateur triche en modifiant
   l'état "premium" côté client.

## Mise en route

### 1. Tesla Developer

1. Crée une application sur [developer.tesla.com](https://developer.tesla.com) → récupère
   `client_id` / `client_secret`.
2. Génère la paire de clés Vehicle Command (`backend/keys/README.md`) et héberge la clé publique
   sur ton domaine via l'endpoint déjà scaffoldé.
3. Enregistre le domaine partenaire (`POST /api/1/partner_accounts`) une fois la clé publique
   accessible en HTTPS.
4. Chaque propriétaire de véhicule devra ensuite "pairer" une clé virtuelle sur son véhicule
   (flux QR code géré par Tesla, à intégrer dans l'onboarding de l'app plus tard).
5. Remplis `backend/.env` (copie de `.env.example`) avec `TESLA_CLIENT_ID`,
   `TESLA_CLIENT_SECRET`, `TESLA_REDIRECT_URI`, `TESLA_AUDIENCE` (région EU ou NA selon le
   marché visé).

### 2. Backend

```bash
cd backend
cp .env.example .env   # puis remplis les valeurs
docker compose up -d   # Postgres local
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev                # http://localhost:3000
```

Le proxy de signature Tesla (`tesla-http-proxy`) doit tourner séparément (voir sa doc officielle)
et être joignable sur `TESLA_COMMAND_PROXY_URL`.

### 3. Mobile

```bash
cd mobile
cp .env.example .env   # puis remplis les valeurs
pnpm install
pnpm start              # ouvre Expo Go ou un simulateur iOS/Android
```

Sans compte Apple Developer, tu peux développer et tester dans le simulateur iOS et via Expo Go
sur Android sans limitation. Le compte Apple Developer (99 $/an) ne devient obligatoire que pour :
- tester de vrais achats StoreKit en sandbox sur un appareil physique iOS,
- distribuer via TestFlight,
- publier sur l'App Store.

### 4. RevenueCat

1. Crée un projet sur [app.revenuecat.com](https://app.revenuecat.com), ajoute une app iOS et
   une app Android.
2. Configure les produits d'abonnement dans App Store Connect / Google Play Console (une fois les
   comptes développeurs prêts), puis importe-les dans RevenueCat sous forme d'**Offering** avec
   une entitlement nommée `premium` (déjà utilisée dans `mobile/src/purchases/RevenueCatProvider.tsx`).
3. Récupère les clés API publiques iOS/Android → `mobile/.env`.
4. Configure un webhook RevenueCat vers `https://api.votre-domaine.com/webhooks/revenuecat`, avec
   le header `Authorization: Bearer <REVENUECAT_WEBHOOK_AUTH_HEADER>` (même valeur que dans
   `backend/.env`).

## État actuel du scaffolding

Fait :
- Authentification OAuth Tesla (échange de code, refresh automatique des tokens)
- Lecture des données véhicule (batterie, climatisation, verrouillage, odomètre)
- Commandes signées (lock/unlock, climatisation, charge) via proxy Tesla
- Écran statistiques de conduite (structure prête, alimentée par `DrivingSession`)
- Paywall RevenueCat + gating des fonctionnalités premium
- Schéma de base de données (Prisma) pour utilisateurs, véhicules, abonnements, trajets

Reste à faire avant une mise en production :
- Ingestion réelle des données de conduite : soit via **Fleet Telemetry** (flux temps réel,
  nécessite un serveur avec certificat TLS dédié côté Tesla), soit via polling périodique de
  `vehicle_data` avec calcul des trajets côté backend — à trancher selon la fréquence de mise à
  jour souhaitée
- Gestion multi-véhicules par utilisateur (actuellement le dashboard prend le premier véhicule)
- Pairing de la clé virtuelle sur le véhicule (flux QR code) dans l'onboarding
- Tests automatisés (l'essentiel de la logique métier est dans `backend/src/services`)
- Comptes Apple Developer / Google Play Console pour la publication
