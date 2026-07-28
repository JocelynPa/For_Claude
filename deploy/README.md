# Déploiement — NAS UGREEN (Docker) avec domaine Route 53

Héberge le backend, Postgres et le proxy de signature Tesla en continu sur
votre NAS, derrière `tesla.jp-engineering.fr` (Route 53), avec TLS
automatique via Caddy + Let's Encrypt. Étape intermédiaire avant un
déploiement AWS — l'architecture (Docker Compose) est directement portable.

`tesla-http-proxy` n'est **jamais exposé à Internet** : seul `backend` lui
parle, sur le réseau Docker interne. Seul Caddy (443/80) est publié.

## 1. Prérequis

- Docker + Docker Compose sur le NAS (via l'app Docker du NAS ; activez SSH
  si besoin pour lancer les commandes ci-dessous)
- AWS CLI configuré (pour Route 53), si vous utilisez le script d'IP
  dynamique
- Les clés déjà générées sur votre Mac (`backend/keys/private-key.pem`,
  `public-key.pem`, `proxy-tls.key`, `proxy-tls.crt` — voir
  `backend/keys/README.md`). Copiez tout le dossier `backend/keys/` sur le
  NAS, au même chemin relatif que dans ce dépôt (`../backend/keys` vu depuis
  `deploy/`).

## 2. DNS (Route 53)

Créez un enregistrement `A` pour `tesla.jp-engineering.fr` pointant vers
votre IP publique domicile.

- **IP fixe** : créez l'enregistrement une fois dans la console Route 53 (ou
  CLI), c'est tout.
- **IP dynamique** (cas le plus courant en résidentiel) : remplissez
  `HOSTED_ZONE_ID` dans `deploy/update-route53-ip.sh`, puis planifiez son
  exécution régulière (cron ou planificateur de tâches du NAS), ex. toutes
  les 15 minutes.

## 3. Routeur

Redirigez les ports **80** et **443** de votre box/routeur vers l'IP locale
du NAS (443 pour le trafic HTTPS, 80 pour la validation automatique du
certificat Let's Encrypt par Caddy).

## 4. Tesla Developer

Dans le portail https://developer.tesla.com, mettez à jour :
- **Allowed Origin(s)** : `https://tesla.jp-engineering.fr`
- **Allowed Redirect URI(s)** : `https://tesla.jp-engineering.fr/auth/tesla/callback`

## 5. Configuration

```bash
cd deploy
cp .env.example .env
```

Renseignez `.env` : `POSTGRES_PASSWORD` (et son écho dans `DATABASE_URL`),
`JWT_SECRET`, `TESLA_CLIENT_ID`/`TESLA_CLIENT_SECRET` (repris du portail
Tesla Developer). `DOMAIN` et `TESLA_REDIRECT_URI` sont déjà pré-remplis
pour `tesla.jp-engineering.fr`.

## 6. Lancer

```bash
docker compose up -d --build
```

Premier démarrage : la construction de `tesla-http-proxy` clone et compile
Go depuis les sources (peut prendre quelques minutes). Caddy va tenter
d'obtenir un certificat Let's Encrypt dès qu'il détecte que le DNS et le
port 80 pointent correctement vers lui — vérifiez les logs :

```bash
docker compose logs -f caddy
```

## 7. Migration de la base

```bash
docker compose run --rm backend npm run prisma:deploy
```

## 8. Enregistrement partner account Tesla

Comme le domaine a changé, l'enregistrement partner (voir
`backend/keys/README.md`) doit être refait pour ce nouveau domaine :

```bash
docker compose run --rm backend npm run tesla:register-partner
```

## 9. Pairage de la clé virtuelle

Le domaine ayant changé, réappairez la clé virtuelle sur le véhicule (sur
l'iPhone du propriétaire, dans Safari) :

```
https://tesla.com/_ak/tesla.jp-engineering.fr
```

## 10. Mettre à jour l'app iOS

Dans `ios/project.yml`, `API_BASE_URL: https://tesla.jp-engineering.fr`, puis
`xcodegen generate` et rebuild. Plus besoin d'ngrok ni de laisser le Mac
allumé.

## Vérifications

```bash
curl -i https://tesla.jp-engineering.fr/health
curl -i https://tesla.jp-engineering.fr/.well-known/appspecific/com.tesla.3p.public-key.pem
```

## Mises à jour

```bash
git pull
docker compose up -d --build
```
