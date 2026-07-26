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
5. Une fois le véhicule associé, il faudra également faire approuver la
   "virtual key" depuis l'app Tesla officielle du propriétaire (Tesla exige
   cette étape manuelle pour toute app tierce envoyant des commandes signées).
