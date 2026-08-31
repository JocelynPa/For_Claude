import type { FastifyInstance } from "fastify";

// Static legal pages required for App Store submission (privacy policy URL,
// EULA/terms of use link in the paywall — Apple guideline 3.1.2). Embedded
// as strings rather than served from disk: the TS build only compiles
// .ts files, so bundling HTML assets separately would need extra build
// tooling for no real benefit at this size. No auth — reviewers and users
// must be able to open these while logged out.
//
// ⚠️ ADDRESS_PLACEHOLDER below must be replaced with the real domiciliation
// address once the domiciliation contract (LegalPlace, Blank, or similar)
// is signed — a French auto-entrepreneur's mentions légales must carry a
// real, verifiable address. Do not publish to the App Store with the
// placeholder still in place.
const ADDRESS_PLACEHOLDER = "[Adresse de domiciliation — à compléter dès signature du contrat]";
const CONTACT_EMAIL = "contact@jp-engineering.fr";
const LAST_UPDATED = "30 août 2026";

const pageStyle = `
  :root { color-scheme: light dark; }
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    line-height: 1.6;
    color: #1b1a17;
    background: #faf9f5;
  }
  @media (prefers-color-scheme: dark) {
    body { color: #f0eee8; background: #131211; }
    a { color: #d9be8c; }
    .updated { color: #a39c8c; }
    section { border-color: rgba(255,255,255,0.1); }
  }
  .page { max-width: 720px; margin: 0 auto; padding: 48px 24px 96px; }
  h1 { font-size: 28px; margin: 0 0 4px; }
  .updated { font-size: 13px; color: #6b6558; margin: 0 0 40px; }
  h2 { font-size: 19px; margin: 36px 0 10px; }
  p, li { font-size: 15.5px; }
  ul { padding-left: 22px; }
  a { color: #a9803f; }
  section + section { margin-top: 4px; }
`;

function page(title: string, body: string): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Sentinel Mode</title><style>${pageStyle}</style></head><body><div class="page"><h1>${title}</h1><p class="updated">Dernière mise à jour : ${LAST_UPDATED}</p>${body}</div></body></html>`;
}

const mentionsLegalesHtml = page(
  "Mentions légales",
  `
  <section>
    <h2>Éditeur</h2>
    <p>
      Sentinel Mode est édité par Jocelyn Pamphile, entrepreneur individuel
      (auto-entrepreneur).<br>
      SIRET : en cours d'immatriculation.<br>
      Adresse : ${ADDRESS_PLACEHOLDER}<br>
      Contact : <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
    </p>
  </section>
  <section>
    <h2>Directeur de la publication</h2>
    <p>Jocelyn Pamphile.</p>
  </section>
  <section>
    <h2>Hébergement</h2>
    <p>
      L'infrastructure serveur (API, base de données) est exploitée
      directement par l'éditeur, sur un serveur personnel situé en France.
      L'application mobile elle-même est distribuée par Apple Inc.,
      1 Apple Park Way, Cupertino, CA 95014, États-Unis, via l'App Store.
    </p>
  </section>
  <section>
    <h2>Propriété intellectuelle</h2>
    <p>
      L'ensemble des contenus, textes, éléments graphiques et logos de
      l'application Sentinel Mode sont la propriété de l'éditeur, sauf
      mention contraire. Toute reproduction non autorisée est interdite.
    </p>
    <p>
      Sentinel Mode n'est ni affilié à, ni approuvé, ni sponsorisé par
      Tesla, Inc. « Tesla » et les noms de fonctionnalités associés sont
      des marques déposées de Tesla, Inc., utilisées ici uniquement à
      titre descriptif pour désigner la compatibilité de l'application.
    </p>
  </section>
  <section>
    <h2>Contact</h2>
    <p>Pour toute question : <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
  </section>
  `
);

const privacyPolicyHtml = page(
  "Politique de confidentialité",
  `
  <section>
    <h2>Responsable de traitement</h2>
    <p>
      Jocelyn Pamphile, entrepreneur individuel (auto-entrepreneur),
      ${ADDRESS_PLACEHOLDER} — <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.
    </p>
  </section>
  <section>
    <h2>Données collectées</h2>
    <ul>
      <li>Jetons d'accès et de rafraîchissement OAuth Tesla (aucun mot de passe Tesla n'est jamais transmis ni stocké par Sentinel Mode — l'authentification se fait entièrement sur le site officiel de Tesla).</li>
      <li>Identifiant, VIN et nom du véhicule Tesla associé au compte.</li>
      <li>Position GPS ponctuelle du véhicule, utilisée uniquement pour afficher la météo locale au moment de la consultation — jamais enregistrée, ni sur l'appareil ni sur le serveur.</li>
      <li>Jeton de notification push (APNs), pour l'envoi d'alertes Sentinel.</li>
      <li>Préférence d'action automatique en cas de détection (klaxon, phares, verrouillage, ou aucune).</li>
      <li>Historique des événements Sentry Mode détectés (horodatage, type d'événement, niveau de batterie) associés au véhicule.</li>
      <li>Données de transaction d'abonnement, gérées directement par Apple (App Store) — Sentinel Mode ne reçoit ni ne stocke aucune donnée de carte bancaire.</li>
    </ul>
  </section>
  <section>
    <h2>Finalités</h2>
    <p>
      Ces données sont utilisées exclusivement pour fournir le service :
      afficher l'état Sentry Mode du véhicule, envoyer des notifications
      lors d'une détection, afficher l'historique des événements, et
      exécuter l'action automatique choisie par l'utilisateur.
    </p>
  </section>
  <section>
    <h2>Base légale</h2>
    <p>
      Exécution du contrat conclu avec l'utilisateur (conditions générales
      d'utilisation) et intérêt légitime à assurer la sécurité et le bon
      fonctionnement du service.
    </p>
  </section>
  <section>
    <h2>Destinataires des données</h2>
    <p>
      Les données ne sont partagées qu'avec les tiers strictement
      nécessaires au fonctionnement du service : l'API Fleet de Tesla,
      Inc. (pour lire et commander le véhicule), Apple Inc. (paiement de
      l'abonnement et notifications push). Aucune donnée n'est vendue,
      louée, ni utilisée à des fins publicitaires. Sentinel Mode n'intègre
      aucun outil d'analyse ou de traçage publicitaire tiers.
    </p>
  </section>
  <section>
    <h2>Transferts hors Union européenne</h2>
    <p>
      Selon la région Tesla Fleet API utilisée par votre compte, certaines
      données du véhicule peuvent transiter par des serveurs Tesla situés
      hors de l'Union européenne. Apple peut également traiter certaines
      données (paiement, notifications) hors de l'Union européenne dans
      le cadre de son propre programme App Store, sous ses propres
      garanties contractuelles.
    </p>
  </section>
  <section>
    <h2>Durée de conservation</h2>
    <p>
      Les données sont conservées tant que le compte utilisateur est
      actif. Elles sont supprimées dans un délai raisonnable après la
      suppression du compte, ou sur simple demande à
      <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.
    </p>
  </section>
  <section>
    <h2>Sécurité</h2>
    <p>
      Les échanges entre l'application et le serveur sont chiffrés
      (HTTPS/TLS). Les jetons d'accès Tesla sont stockés de façon
      sécurisée côté serveur et ne sont jamais exposés à l'application ni
      à des tiers.
    </p>
  </section>
  <section>
    <h2>Vos droits</h2>
    <p>
      Conformément au Règlement Général sur la Protection des Données
      (RGPD), vous disposez d'un droit d'accès, de rectification,
      d'effacement, de limitation, d'opposition et de portabilité sur vos
      données. Pour exercer ces droits, contactez
      <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>. Vous disposez
      également du droit d'introduire une réclamation auprès de la
      Commission Nationale de l'Informatique et des Libertés (CNIL,
      <a href="https://www.cnil.fr">www.cnil.fr</a>).
    </p>
  </section>
  <section>
    <h2>Cookies et traceurs</h2>
    <p>
      Sentinel Mode est une application native et n'utilise aucun cookie
      web ni traceur publicitaire.
    </p>
  </section>
  <section>
    <h2>Mineurs</h2>
    <p>
      L'application nécessite un compte Tesla et un identifiant Apple
      valides ; elle n'est pas destinée à un usage par des mineurs non
      accompagnés.
    </p>
  </section>
  <section>
    <h2>Modifications</h2>
    <p>
      Cette politique peut être mise à jour ; la date en haut de page
      reflète la dernière modification.
    </p>
  </section>
  `
);

const termsOfUseHtml = page(
  "Conditions générales d'utilisation",
  `
  <section>
    <h2>1. Objet</h2>
    <p>
      Sentinel Mode est une application compagnon non officielle qui
      permet de surveiller le Sentry Mode d'un véhicule Tesla, de
      recevoir des notifications lors d'une détection, et de déclencher
      une action automatique (klaxon, phares, verrouillage). Sentinel
      Mode n'est ni affilié à, ni approuvé, ni sponsorisé par Tesla, Inc.
    </p>
  </section>
  <section>
    <h2>2. Compte et accès</h2>
    <p>
      L'utilisation de Sentinel Mode nécessite un compte Tesla valide.
      La connexion s'effectue exclusivement via la page d'authentification
      officielle de Tesla (OAuth) — Sentinel Mode ne collecte jamais votre
      mot de passe Tesla.
    </p>
  </section>
  <section>
    <h2>3. Fonctionnalités gratuites et Premium</h2>
    <p>
      Une partie des fonctionnalités est accessible gratuitement.
      L'abonnement Premium (voir article 4) donne accès à des
      fonctionnalités supplémentaires présentées dans l'application au
      moment de la souscription.
    </p>
  </section>
  <section>
    <h2>4. Abonnement Premium</h2>
    <ul>
      <li>Tarifs : 4,99&nbsp;€ par mois, ou 39,99&nbsp;€ par an.</li>
      <li>Un essai gratuit de 7 jours est proposé lors de la première souscription. Toute portion non utilisée de l'essai gratuit est perdue dès l'achat d'un abonnement Premium.</li>
      <li>Le paiement est prélevé sur votre compte Apple (iTunes/App Store) à la confirmation de l'achat.</li>
      <li>L'abonnement se renouvelle automatiquement pour une durée identique, sauf résiliation au moins 24 heures avant la fin de la période en cours.</li>
      <li>Vous pouvez gérer ou résilier votre abonnement à tout moment depuis les réglages de votre compte Apple ID (Réglages → votre nom → Abonnements).</li>
      <li>Aucun remboursement au prorata n'est possible en cas de résiliation en cours de période, sauf disposition légale contraire ou politique d'Apple applicable.</li>
    </ul>
  </section>
  <section>
    <h2>5. Disponibilité du service</h2>
    <p>
      Sentinel Mode dépend de la disponibilité de l'API Tesla Fleet, des
      services Apple (notifications push, paiement) et de l'infrastructure
      serveur de l'éditeur. Aucune garantie de disponibilité continue ou
      ininterrompue n'est fournie.
    </p>
  </section>
  <section>
    <h2>6. Responsabilité</h2>
    <p>
      L'utilisateur reste seul responsable de l'usage de son véhicule et
      des actions déclenchées via l'application. L'éditeur ne saurait être
      tenu responsable des dommages résultant d'une indisponibilité de
      l'API Tesla, d'Apple, ou de tout tiers, ni d'un usage non conforme
      de l'application.
    </p>
  </section>
  <section>
    <h2>7. Résiliation</h2>
    <p>
      L'utilisateur peut cesser d'utiliser l'application et déconnecter
      son compte Tesla à tout moment depuis les réglages de
      l'application. La suppression du compte entraîne la suppression des
      données associées, conformément à la politique de confidentialité.
    </p>
  </section>
  <section>
    <h2>8. Droit applicable</h2>
    <p>
      Les présentes conditions sont soumises au droit français. Tout
      litige relève de la compétence des tribunaux français.
    </p>
  </section>
  <section>
    <h2>9. Modification des conditions</h2>
    <p>
      Ces conditions peuvent être mises à jour ; la date en haut de page
      reflète la dernière modification. L'utilisation continue de
      l'application après modification vaut acceptation des nouvelles
      conditions.
    </p>
  </section>
  <section>
    <h2>10. Contact</h2>
    <p>Pour toute question : <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
  </section>
  `
);

export async function legalRoutes(app: FastifyInstance) {
  app.get("/legal/mentions-legales", async (_request, reply) => {
    reply.type("text/html; charset=utf-8").send(mentionsLegalesHtml);
  });

  app.get("/legal/politique-de-confidentialite", async (_request, reply) => {
    reply.type("text/html; charset=utf-8").send(privacyPolicyHtml);
  });

  app.get("/legal/conditions-generales-utilisation", async (_request, reply) => {
    reply.type("text/html; charset=utf-8").send(termsOfUseHtml);
  });
}
