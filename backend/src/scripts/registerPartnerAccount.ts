// One-time (per domain) setup step required by Tesla before any Fleet API
// call for this app succeeds in a given region: the app itself ("partner
// account") must be registered against that region's Fleet API host with
// the public domain serving its Vehicle Command public key.
// https://developer.tesla.com/docs/fleet-api/endpoints/partner-endpoints#register
//
// Run again any time TESLA_REDIRECT_URI's domain changes — e.g. a new
// ngrok free-tier URL after every restart. Consider a static ngrok domain
// (`ngrok http --domain=your-static-domain.ngrok-free.app 3000`, free on
// personal accounts) to avoid re-running this on every restart.
import { env } from "../config/env.js";
import { fetchPartnerToken } from "../services/teslaClient.js";

async function main() {
  const domain = new URL(env.TESLA_REDIRECT_URI).hostname;
  console.log(`Registering partner account for domain: ${domain}`);
  console.log(`Region: ${env.TESLA_AUDIENCE}`);

  const token = await fetchPartnerToken();

  const response = await fetch(`${env.TESLA_AUDIENCE}/api/1/partner_accounts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ domain }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Partner registration failed: ${response.status} ${body}`);
  }

  console.log("Partner account registered successfully:");
  console.log(body);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
