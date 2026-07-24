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
4. Une fois le véhicule associé, il faudra également faire approuver la
   "virtual key" depuis l'app Tesla officielle du propriétaire (Tesla exige
   cette étape manuelle pour toute app tierce envoyant des commandes signées).
