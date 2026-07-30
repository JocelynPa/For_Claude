# Déploiement — NAS UGREEN (Docker) avec domaine Route 53

Héberge le backend, Postgres et le proxy de signature Tesla en continu sur
votre NAS, derrière `companion.jp-engineering.fr` (Route 53), avec TLS géré par
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

Créez un enregistrement `A` pour `companion.jp-engineering.fr` pointant vers
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
- **Allowed Origin(s)** : `https://companion.jp-engineering.fr`
- **Allowed Redirect URI(s)** : `https://companion.jp-engineering.fr/auth/tesla/callback`

## 5. Configuration

```bash
cd deploy
cp .env.example .env
```

Renseignez `.env` : `POSTGRES_PASSWORD` (et son écho dans `DATABASE_URL`),
`JWT_SECRET`, `TESLA_CLIENT_ID`/`TESLA_CLIENT_SECRET` (repris du portail
Tesla Developer). `TESLA_REDIRECT_URI` est déjà pré-rempli pour
`companion.jp-engineering.fr`.

## 6. Lancer

```bash
docker compose up -d --build
```

Premier démarrage : la construction de `tesla-http-proxy` clone et compile
Go depuis les sources (peut prendre quelques minutes).

Les trois conteneurs (`backend`, `postgres`, `tesla-proxy`) ont chacun leur
propre IP fixe sur le LAN via un réseau macvlan (`BACKEND_STATIC_IP`,
`POSTGRES_STATIC_IP`, `TESLA_PROXY_STATIC_IP` dans `.env`), en plus de
rester joignables entre eux par nom de service sur le réseau Docker interne.
Vérifiez que le backend répond avant de configurer NPM :

```bash
curl -i http://<BACKEND_STATIC_IP>:3000/health
```

⚠️ `tesla-proxy` était volontairement sans aucune présence réseau LAN
auparavant (uniquement joignable par `backend`, jamais par le reste du
réseau) — il détient la clé privée qui signe les commandes véhicule. Le
mettre sur le macvlan le rend désormais joignable par n'importe quel
appareil de votre réseau local. Restreignez l'accès au niveau du
routeur/firewall du LAN si vous voulez conserver cette isolation.

Un réseau macvlan isole en général le conteneur de l'hôte Docker lui-même
et des conteneurs restés en réseau bridge classique — donc NPM doit être
rattaché à ce **même** réseau macvlan pour pouvoir joindre ces IP (déjà le
cas ici).

## 6bis. Proxy Host dans Nginx Proxy Manager

Dans l'interface NPM, **Proxy Hosts → Add Proxy Host** :

- **Domain Names** : `companion.jp-engineering.fr`
- **Forward Hostname / IP** : `<BACKEND_STATIC_IP>` (la valeur définie dans
  `deploy/.env`)
- **Forward Port** : `3000`
- Onglet **SSL** : demandez un certificat Let's Encrypt, activez **Force
  SSL** et **HTTP/2**

## 7. Migration de la base

`backend` ayant une IP macvlan fixe, `docker compose run` (qui crée un
nouveau conteneur) entre en conflit avec le conteneur déjà en cours
d'exécution sur cette même IP (`Error response from daemon: failed to set
up container networking: Address already in use`). Utilisez `exec` à la
place, qui exécute la commande **dans** le conteneur déjà lancé :

```bash
docker compose exec backend npm run prisma:deploy
```

## 8. Enregistrement partner account Tesla

Comme le domaine a changé, l'enregistrement partner (voir
`backend/keys/README.md`) doit être refait pour ce nouveau domaine :

```bash
docker compose exec backend npm run tesla:register-partner:built
```

## 9. Pairage de la clé virtuelle

Le domaine ayant changé, réappairez la clé virtuelle sur le véhicule (sur
l'iPhone du propriétaire, dans Safari) :

```
https://tesla.com/_ak/companion.jp-engineering.fr
```

## 10. Mettre à jour l'app iOS

Dans `ios/project.yml`, `API_BASE_URL: https://companion.jp-engineering.fr`, puis
`xcodegen generate` et rebuild. Plus besoin d'ngrok ni de laisser le Mac
allumé.

## Vérifications

```bash
curl -i https://companion.jp-engineering.fr/health
curl -i https://companion.jp-engineering.fr/.well-known/appspecific/com.tesla.3p.public-key.pem
```

## 11. Fleet Telemetry (timeline Sentry réelle)

Optionnel — sans ça, l'onglet Sentry affiche une liste vide (plus de mock,
mais rien de réel tant que cette section n'est pas faite). Permet de
recevoir en direct l'état Sentry (`SentryModeState` : Off/Idle/Armed/
Aware/Panic) et la connectivité du véhicule, streamés par la voiture
elle-même — voir la conversation précédente pour le détail des sources
vérifiées (`teslamotors/fleet-telemetry`, `teslamotors/vehicle-command`).

⚠️ Le format exact du payload d'abonnement (`POST
/vehicles/:id/telemetry/subscribe`) est basé sur le code source de
`tesla-http-proxy` et de la documentation tierce, pas vérifié de bout en
bout contre un véhicule réel (la doc officielle bloquait mes requêtes
automatisées pendant la rédaction). Test réel nécessaire à l'étape 11.7.

**Important** : ce service fait du **mTLS en direct** — contrairement à
`backend`, il ne peut **pas** passer par NPM (la terminaison TLS doit se
faire directement dans le conteneur pour valider le certificat client du
véhicule). Il lui faut son propre point d'entrée réseau.

### 11.1 Sous-domaine dédié

Créez un enregistrement DNS `A` pour `telemetry.jp-engineering.fr` (ou le
nom choisi dans `FLEET_TELEMETRY_HOSTNAME`) — **distinct** du domaine
principal, et qui ne doit **pas contenir "tesla"**. Même remarque que pour
le domaine principal concernant l'IP dynamique (§2).

### 11.2 Configuration

Complétez dans `.env` : `FLEET_TELEMETRY_STATIC_IP` (IP macvlan dédiée),
`FLEET_TELEMETRY_HOSTNAME`, `FLEET_TELEMETRY_CA_FILE` (garder en cohérence
avec le hostname), `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`
(permissions Route 53 uniquement, comme pour `update-route53-ip.sh`),
`LETSENCRYPT_EMAIL`.

Dans `deploy/fleet-telemetry-config.json`, remplacez les deux occurrences
de `REPLACE_WITH_FLEET_TELEMETRY_HOSTNAME` par votre hostname exact.

### 11.3 Certificat (DNS-01 via Route 53)

```bash
docker compose run --rm certbot
```

Ne fait pas partie de `docker compose up` — à relancer manuellement avant
expiration (~90 jours), ou planifiez via cron. C'est la **même commande**
pour l'émission initiale et le renouvellement : `certbot certonly` sur un
certificat encore valide se contente d'afficher "not yet due for renewal"
et ne fait rien, pas besoin d'une commande `renew` séparée.

### 11.4 Routeur

Redirigez un port de votre choix (ex. 443, ou un autre si déjà pris par
NPM sur l'IP du NAS — ici ça n'entre pas en conflit puisque
`fleet-telemetry` a sa propre IP macvlan) vers
`<FLEET_TELEMETRY_STATIC_IP>:443`.

### 11.5 Lancer

```bash
docker compose up -d redis fleet-telemetry
docker compose logs fleet-telemetry --tail 30
```

### 11.6 Migration de la base

```bash
docker compose exec backend npm run prisma:deploy
```

### 11.7 Abonner un véhicule

Depuis l'app iOS, récupérez votre token de session (ou utilisez un outil
comme Charles Proxy / les logs backend), puis :

```bash
curl -X POST https://companion.jp-engineering.fr/vehicles/<VIN>/telemetry/subscribe \
  -H "Authorization: Bearer <votre JWT app>" \
  -H "Content-Type: application/json" \
  -d '{"intervalSeconds": 10}'
```

Si Tesla renvoie une erreur ici, c'est le signal que le format du payload
(§ ci-dessus) doit être ajusté — la réponse d'erreur de Tesla est
généralement explicite sur le champ en cause.

### 11.8 Vérifier

```bash
docker compose logs backend --tail 30 | grep -i telemetry
```

Puis, dans l'app iOS, l'onglet Sentry devrait commencer à recevoir de
vraies entrées à la prochaine transition d'état Sentry (activer/désactiver
Sentry Mode depuis l'app Tesla officielle pour tester rapidement).

## Mises à jour

```bash
git pull
docker compose up -d --build
```
