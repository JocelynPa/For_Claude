# Clés Vehicle Command

Ce dossier reçoit les clés générées avec le [Tesla `vehicle-command` SDK](https://github.com/teslamotors/vehicle-command),
utilisées pour signer les commandes envoyées au véhicule. **Ne jamais committer ces fichiers** (déjà ignorés par git).

## Génération

```bash
go install github.com/teslamotors/vehicle-command/cmd/tesla-keygen@latest
tesla-keygen -key-file private-key.pem create > com.tesla.3p.public-key.pem
```

- `private-key.pem` reste uniquement sur le serveur qui exécute le proxy de signature (`tesla-http-proxy`),
  jamais dans l'app mobile ni dans le dépôt.
- `com.tesla.3p.public-key.pem` doit être servi tel quel sur
  `https://<votre-domaine>/.well-known/appspecific/com.tesla.3p.public-key.pem`
  (voir `src/routes/wellKnown.ts`).

## Enregistrement du domaine

Une fois la clé publique accessible en HTTPS sur votre domaine, enregistrez le domaine partenaire
depuis le Tesla Developer Portal (`POST /api/1/partner_accounts`) puis demandez au propriétaire de
chaque véhicule d'exécuter le pairing en scannant le QR code affiché par l'app (flux `virtual-key`),
étape obligatoire avant que les commandes signées fonctionnent sur ce véhicule.
