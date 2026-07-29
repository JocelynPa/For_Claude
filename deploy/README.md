# Déploiement — NAS UGREEN (Docker) avec domaine Route 53

Héberge le backend, Postgres et le proxy de signature Tesla en continu sur
votre NAS, derrière `tesla.jp-engineering.fr` (Route 53), avec TLS géré par
votre instance **Nginx Proxy Manager** existante. Étape intermédiaire avant
un déploiement AWS — l'architecture (Docker Compose) est directement
portable.

`tesla-http-proxy` n'est **jamais exposé à Internet** : seul `backend` lui
parle, sur le réseau Docker interne. `backend` publie son port 3000 sur le
réseau local du NAS (pas via le routeur) pour que NPM puisse le joindre ;
seul NPM (443/80, déjà en place) est réellement exposé à Internet.

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

Rien à faire ici si NPM reçoit déjà le trafic 80/443 pour vos autres
services — on ajoute juste un nouveau Proxy Host dans NPM, pas un nouveau
point d'entrée réseau.

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
Tesla Developer). `TESLA_REDIRECT_URI` est déjà pré-rempli pour
`tesla.jp-engineering.fr`.

## 6. Lancer

```bash
docker compose up -d --build
```

Premier démarrage : la construction de `tesla-http-proxy` clone et compile
Go depuis les sources (peut prendre quelques minutes).

Le backend a sa propre IP fixe sur le LAN via un réseau macvlan
(`BACKEND_STATIC_IP` dans `.env`), plutôt que d'être publié sur l'IP du NAS.
Vérifiez qu'il répond avant de configurer NPM :

```bash
curl -i http://<BACKEND_STATIC_IP>:3000/health
```

⚠️ Un réseau macvlan isole en général le conteneur de l'hôte Docker
lui-même et des conteneurs restés en réseau bridge classique — donc si NPM
tourne aussi en conteneur sur ce NAS, il doit être rattaché à ce **même**
réseau macvlan pour pouvoir joindre `BACKEND_STATIC_IP`, sinon la requête
n'aboutira jamais malgré une configuration NPM correcte.

## 6bis. Proxy Host dans Nginx Proxy Manager

Dans l'interface NPM, **Proxy Hosts → Add Proxy Host** :

- **Domain Names** : `tesla.jp-engineering.fr`
- **Forward Hostname / IP** : `<BACKEND_STATIC_IP>` (la valeur définie dans
  `deploy/.env`)
- **Forward Port** : `3000`
- Onglet **SSL** : demandez un certificat Let's Encrypt, activez **Force
  SSL** et **HTTP/2**

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
