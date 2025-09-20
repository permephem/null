#!/usr/bin/env bash
set -euo pipefail

# ---- Config --------------------------------------------------------
RELAYER_BASE="${RELAYER_BASE:-http://localhost:8787}"
API_KEY="${API_KEY:-dev-demo-key}"     # Replace with a real per-venue key
EVENT_ID="${EVENT_ID:-ARENA-2025-10-12-TourA}"
SEAT="${SEAT:-112-D-8}"
HOLDER_A="${HOLDER_A:-alice@example.com}"
HOLDER_B="${HOLDER_B:-bob@example.com}"
# -------------------------------------------------------------------

json() { jq -r "$1"; }

headline() {
  echo ""
  echo "================================================================"
  echo "== $1"
  echo "================================================================"
}

issue() {
  headline "ISSUE"
  RES=$(curl -sS -X POST "$RELAYER_BASE/tickets/issue" \
    -H "content-type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d @<(cat <<JSON
{
  "eventId": "$EVENT_ID",
  "seat": "$SEAT",
  "holderIdentifier": "$HOLDER_A",
  "policy": {
    "maxResalePct": 110,
    "transferWindowHours": 48,
    "kycLevel": "light",
    "resaleOnlyVia": ["https://exchange.null.xyz"]
  },
  "assurance": 1
}
JSON
))
  echo "$RES" | jq .
  TICKET_COMMIT=$(echo "$RES" | json '.ticketIdCommit')
  CANON_TX=$(echo "$RES" | json '.canonTx')
  echo "TICKET_COMMIT=$TICKET_COMMIT"
  echo "CANON_TX=$CANON_TX"
}

transfer() {
  headline "TRANSFER"
  RES=$(curl -sS -X POST "$RELAYER_BASE/tickets/transfer" \
    -H "content-type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d @<(cat <<JSON
{
  "ticketIdCommit": "$TICKET_COMMIT",
  "fromIdentifier": "$HOLDER_A",
  "toIdentifier": "$HOLDER_B",
  "assurance": 1
}
JSON
))
  echo "$RES" | jq .
  TRANSFER_TX=$(echo "$RES" | json '.canonTx')
  echo "TRANSFER_CANON_TX=$TRANSFER_TX"
}

revoke() {
  headline "REVOKE"
  RES=$(curl -sS -X POST "$RELAYER_BASE/tickets/revoke" \
    -H "content-type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d @<(cat <<JSON
{
  "ticketIdCommit": "$TICKET_COMMIT",
  "reason": "policy_breach",
  "assurance": 1
}
JSON
))
  echo "$RES" | jq .
  REVOKE_TX=$(echo "$RES" | json '.canonTx')
  echo "REVOKE_CANON_TX=$REVOKE_TX"
}

verify_allow() {
  headline "VERIFY (ALLOW)"
  PAYLOAD="TICKET:$TICKET_COMMIT:session-xyz"
  RES=$(curl -sS -X POST "$RELAYER_BASE/tickets/verify" \
    -H "content-type: application/json" \
    -d @<(cat <<JSON
{
  "ticketQrPayload": "$PAYLOAD",
  "holderProof": "123456"
}
JSON
))
  echo "$RES" | jq .
}

verify_deny() {
  headline "VERIFY (DENY after revoke)"
  PAYLOAD="TICKET:$TICKET_COMMIT:session-xyz"
  RES=$(curl -sS -X POST "$RELAYER_BASE/tickets/verify" \
    -H "content-type: application/json" \
    -d @<(cat <<JSON
{
  "ticketQrPayload": "$PAYLOAD",
  "holderProof": "123456"
}
JSON
))
  echo "$RES" | jq .
}

main() {
  issue
  verify_allow
  transfer
  verify_allow
  revoke
  verify_deny
  echo ""
  echo "✅ Smoke test complete."
}

main "$@"
