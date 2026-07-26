# Clé Vehicle Command

Tesla exige que les commandes véhicule envoyées via la Fleet API (verrouillage,
climatisation, klaxon, etc.) soient associées à une paire de clés EC propre à
votre application tierce, et que la clé publique soit accessible publiquement
à cette adresse exacte :

```
https://votre-domaine.example.com/.well-known/appspecific/com.tesla.3p.public-key.pem
```

`src/routes/wellKnown.ts` sert ce fichier depuis `backend/keys/public-key.pem`.

## Génération de la paire de clés

```bash
openssl ecparam -genkey -name prime256v1 -noout -out backend/keys/private-key.pem
openssl ec -in backend/keys/private-key.pem -pubout -out backend/keys/public-key.pem
```

`private-key.pem` ne doit **jamais** être committé (déjà exclu par
`.gitignore`). `public-key.pem` peut être commité ou déployé séparément.

## Étapes côté Tesla Developer

1. Créer une application sur https://developer.tesla.com
2. Renseigner le domaine où `public-key.pem` sera servi ("Allowed Origin(s)")
3. Renseigner `TESLA_REDIRECT_URI` (doit pointer vers
   `/auth/tesla/callback` sur ce même domaine)
4. **Enregistrer le "partner account"** (obligatoire, une fois par domaine et
   par région Fleet API) :
   ```bash
   npm run tesla:register-partner
   ```
   Sans cette étape, tout appel Fleet API échoue avec une erreur `412
   Account ... must be registered in the current region`. À relancer à
   chaque fois que le domaine change (ex. nouvelle URL ngrok gratuite après
   un redémarrage) — pour éviter ça, utilisez un domaine ngrok statique
   (`ngrok http --domain=votre-domaine.ngrok-free.app 3000`, gratuit sur les
   comptes personnels).
5. **Ajouter la clé virtuelle sur le véhicule** — obligatoire pour que la
   moindre commande (verrouillage, climatisation…) fonctionne. Ouvrez, sur
   l'iPhone associé au compte Tesla, dans Safari (l'app Tesla doit être
   installée) :
   ```
   https://tesla.com/_ak/votre-domaine.example.com
   ```
   (remplacez par le domaine exact de `TESLA_REDIRECT_URI`). Ça ouvre l'app
   Tesla avec un prompt "Ajouter la clé". N'attendez pas un prompt
   automatique lors de la première commande — il est peu fiable en pratique
   (notamment en test via tunnel) ; ce lien est la méthode fiable documentée
   par Tesla. Un raccourci vers ce lien est aussi disponible dans
   Réglages → Sécurité de l'app iOS.

## Proxy de signature des commandes (Vehicle Command Protocol)

La lecture des données (`/vehicles`, `vehicle_data`) fonctionne avec un
simple appel Bearer token. **Les commandes, elles, doivent être signées**
avec la clé privée générée ci-dessus — Tesla les rejette silencieusement
sinon, sur tout véhicule qui applique le Vehicle Command Protocol (la
quasi-totalité des véhicules connectés aujourd'hui). Le backend route donc
les commandes (`signedCommandFetch` dans `teslaClient.ts`) vers un proxy
local, [`tesla-http-proxy`](https://github.com/teslamotors/vehicle-command),
l'outil officiel de Tesla (Go) qui effectue cette signature.

### Installation et lancement

```bash
# Nécessite Go (brew install go)
#
# `go install github.com/teslamotors/vehicle-command/cmd/tesla-http-proxy@latest`
# échoue ("go.mod ... contains one or more replace directives") : ces
# directives ne sont respectées que si vous êtes DANS le module. Il faut
# donc cloner le dépôt et builder depuis l'intérieur :
git clone https://github.com/teslamotors/vehicle-command.git /tmp/vehicle-command
cd /tmp/vehicle-command
go install ./cmd/tesla-http-proxy
cd -

# Vérifiez que le binaire est bien dans le PATH (go install l'installe dans $GOPATH/bin)
echo 'export PATH="$(go env GOPATH)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
tesla-http-proxy -h   # doit afficher l'aide, pas "command not found"

# Le proxy sert du HTTPS : générez un certificat auto-signé pour son usage local
openssl req -x509 -nodes -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 \
  -keyout backend/keys/proxy-tls.key -out backend/keys/proxy-tls.crt \
  -days 365 -subj "/CN=localhost"

# Lancer le proxy (dans un terminal dédié, en plus de `npm run dev`)
tesla-http-proxy \
  -tls-key backend/keys/proxy-tls.key \
  -cert backend/keys/proxy-tls.crt \
  -key-file backend/keys/private-key.pem \
  -port 4443
```

(`-cert`, pas `-tls-crt` — vérifié via `tesla-http-proxy -h`.)

`backend/.env` : `TESLA_COMMAND_PROXY_URL=https://localhost:4443` (valeur
par défaut). Le backend fait confiance au certificat auto-signé uniquement
pour cet appel local précis (`teslaClient.ts`), jamais plus largement.
