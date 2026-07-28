#!/usr/bin/env bash
# Updates a Route 53 A record to the current public IP. Only needed if your
# home internet connection doesn't have a static IP — run periodically
# (cron, or the NAS's own task scheduler), e.g. every 15 minutes. If your ISP
# gives you a static IP, skip this and just set the A record once manually.
#
# Requires the AWS CLI configured with credentials scoped to
# route53:ChangeResourceRecordSets on this one hosted zone — avoid using
# broad admin credentials for a script that runs unattended on a home NAS.
set -euo pipefail

HOSTED_ZONE_ID="REPLACE_WITH_YOUR_HOSTED_ZONE_ID"
RECORD_NAME="tesla.jp-engineering.fr"
TTL=300

CURRENT_IP="$(curl -s https://checkip.amazonaws.com)"

CHANGE_FILE="$(mktemp)"
trap 'rm -f "$CHANGE_FILE"' EXIT

cat > "$CHANGE_FILE" <<EOF
{
  "Comment": "Dynamic IP update for ${RECORD_NAME}",
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "${RECORD_NAME}",
      "Type": "A",
      "TTL": ${TTL},
      "ResourceRecords": [{"Value": "${CURRENT_IP}"}]
    }
  }]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id "${HOSTED_ZONE_ID}" \
  --change-batch "file://${CHANGE_FILE}"
