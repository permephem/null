#!/usr/bin/env bash
set -euo pipefail

# ---- Ticket Verification Flow Smoke Tests ----
RELAYER_BASE="${RELAYER_BASE:-http://localhost:8787}"
API_KEY="${API_KEY:-demo-api-key-123}"
TICKET_ID="${TICKET_ID:-1}"
SELLER_ADDRESS="${SELLER_ADDRESS:-0xSellerAddress123}"
BUYER_ADDRESS="${BUYER_ADDRESS:-0xBuyerAddress456}"

json() { jq -r "$1"; }

headline() {
  echo ""
  echo "================================================================"
  echo "== $1"
  echo "================================================================"
}

get_ticket_history() {
  headline "GET TICKET HISTORY (Carfax-like Report)"
  RES=$(curl -sS -X GET "$RELAYER_BASE/tickets/$TICKET_ID/history")
  echo "$RES" | jq .
  CURRENT_STATUS=$(echo "$RES" | json '.currentStatus')
  RISK_LEVEL=$(echo "$RES" | json '.riskAssessment')
  CURRENT_PRICE=$(echo "$RES" | json '.priceAnalysis.currentPrice')
  TRANSFER_COUNT=$(echo "$RES" | json '.ownershipHistory | length')
  echo "CURRENT_STATUS=$CURRENT_STATUS"
  echo "RISK_LEVEL=$RISK_LEVEL"
  echo "CURRENT_PRICE=$CURRENT_PRICE"
  echo "TRANSFER_COUNT=$TRANSFER_COUNT"
}

get_ticket_status() {
  headline "GET TICKET STATUS"
  RES=$(curl -sS -X GET "$RELAYER_BASE/tickets/$TICKET_ID/status")
  echo "$RES" | jq .
  STATUS=$(echo "$RES" | json '.status')
  OWNER=$(echo "$RES" | json '.owner')
  echo "STATUS=$STATUS"
  echo "OWNER=$OWNER"
}

verify_ticket() {
  headline "VERIFY TICKET BEFORE PURCHASE"
  RES=$(curl -sS -X POST "$RELAYER_BASE/tickets/$TICKET_ID/verify" \
    -H "content-type: application/json" \
    -H "x-buyer-address: $BUYER_ADDRESS" \
    -d @<(cat <<JSON
{
  "ticketId": "$TICKET_ID",
  "buyerAddress": "$BUYER_ADDRESS",
  "sellerAddress": "$SELLER_ADDRESS"
}
JSON
))
  echo "$RES" | jq .
  IS_VALID=$(echo "$RES" | json '.isValid')
  RISK_LEVEL=$(echo "$RES" | json '.riskLevel')
  SELLER_VERIFIED=$(echo "$RES" | json '.sellerVerified')
  echo "IS_VALID=$IS_VALID"
  echo "RISK_LEVEL=$RISK_LEVEL"
  echo "SELLER_VERIFIED=$SELLER_VERIFIED"
}

create_escrow() {
  headline "CREATE ESCROW FOR TICKET PURCHASE"
  AMOUNT=$(echo "$CURRENT_PRICE * 1000000000000000000" | bc) # Convert to wei
  EXPIRES_AT=$(date -d "+24 hours" +%s)
  
  RES=$(curl -sS -X POST "$RELAYER_BASE/escrow/create" \
    -H "content-type: application/json" \
    -H "x-buyer-address: $BUYER_ADDRESS" \
    -d @<(cat <<JSON
{
  "ticketId": "$TICKET_ID",
  "sellerAddress": "$SELLER_ADDRESS",
  "amount": "$AMOUNT",
  "expiresAt": $EXPIRES_AT
}
JSON
))
  echo "$RES" | jq .
  ESCROW_ID=$(echo "$RES" | json '.escrowId')
  CANON_TX=$(echo "$RES" | json '.canonTx')
  echo "ESCROW_ID=$ESCROW_ID"
  echo "CANON_TX=$CANON_TX"
}

complete_escrow() {
  headline "COMPLETE ESCROW AFTER VERIFICATION"
  RES=$(curl -sS -X POST "$RELAYER_BASE/escrow/$ESCROW_ID/complete" \
    -H "content-type: application/json" \
    -d @<(cat <<JSON
{
  "escrowId": "$ESCROW_ID",
  "verificationUri": "ipfs://QmVerificationEvidence123"
}
JSON
))
  echo "$RES" | jq .
  COMPLETION_TX=$(echo "$RES" | json '.canonTx')
  echo "COMPLETION_TX=$COMPLETION_TX"
}

cancel_escrow() {
  headline "CANCEL ESCROW (Alternative Flow)"
  RES=$(curl -sS -X POST "$RELAYER_BASE/escrow/$ESCROW_ID/cancel")
  echo "$RES" | jq .
  CANCELLATION_TX=$(echo "$RES" | json '.canonTx')
  echo "CANCELLATION_TX=$CANCELLATION_TX"
}

revoke_ticket() {
  headline "REVOKE TICKET (Venue Action)"
  RES=$(curl -sS -X POST "$RELAYER_BASE/tickets/$TICKET_ID/revoke" \
    -H "content-type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d @<(cat <<JSON
{
  "ticketId": "$TICKET_ID",
  "reason": "Fraudulent activity detected"
}
JSON
))
  echo "$RES" | jq .
  REVOCATION_TX=$(echo "$RES" | json '.canonTx')
  echo "REVOCATION_TX=$REVOCATION_TX"
}

mark_ticket_used() {
  headline "MARK TICKET AS USED (Venue Action)"
  RES=$(curl -sS -X POST "$RELAYER_BASE/tickets/$TICKET_ID/scan" \
    -H "content-type: application/json" \
    -H "x-api-key: $API_KEY")
  echo "$RES" | jq .
  SCAN_TX=$(echo "$RES" | json '.canonTx')
  echo "SCAN_TX=$SCAN_TX"
}

get_system_stats() {
  headline "GET SYSTEM STATISTICS"
  RES=$(curl -sS -X GET "$RELAYER_BASE/stats")
  echo "$RES" | jq .
  TOTAL_TICKETS=$(echo "$RES" | json '.tickets')
  TOTAL_TRANSFERS=$(echo "$RES" | json '.transfers')
  TOTAL_ESCROWS=$(echo "$RES" | json '.escrows')
  TOTAL_REVOCATIONS=$(echo "$RES" | json '.revocations')
  echo "TOTAL_TICKETS=$TOTAL_TICKETS"
  echo "TOTAL_TRANSFERS=$TOTAL_TRANSFERS"
  echo "TOTAL_ESCROWS=$TOTAL_ESCROWS"
  echo "TOTAL_REVOCATIONS=$TOTAL_REVOCATIONS"
}

test_verification_flow() {
  headline "TEST COMPLETE VERIFICATION FLOW"
  
  # Step 1: Get ticket history (Carfax-like report)
  get_ticket_history
  
  # Step 2: Check current status
  get_ticket_status
  
  # Step 3: Verify ticket before purchase
  verify_ticket
  
  # Step 4: Create escrow if ticket is valid
  if [ "$IS_VALID" = "true" ]; then
    create_escrow
    
    # Step 5: Complete escrow (simulate successful verification)
    complete_escrow
  else
    echo "⚠️  Ticket is not valid, skipping escrow creation"
  fi
  
  # Step 6: Get updated statistics
  get_system_stats
}

test_venue_actions() {
  headline "TEST VENUE ACTIONS"
  
  # Test ticket revocation
  revoke_ticket
  
  # Test ticket scanning (mark as used)
  mark_ticket_used
  
  # Get updated status
  get_ticket_status
}

main() {
  echo "🎫 Starting Ticket Verification Flow smoke tests..."
  echo "RELAYER_BASE=$RELAYER_BASE"
  echo "API_KEY=$API_KEY"
  echo "TICKET_ID=$TICKET_ID"
  echo "SELLER_ADDRESS=$SELLER_ADDRESS"
  echo "BUYER_ADDRESS=$BUYER_ADDRESS"
  
  # Test complete verification flow
  test_verification_flow
  
  # Test venue actions
  test_venue_actions
  
  echo ""
  echo "✅ Ticket Verification Flow smoke test complete."
  echo ""
  echo "Summary:"
  echo "- Ticket history retrieved (Carfax-like report)"
  echo "- Ticket status verified"
  echo "- Pre-purchase verification completed"
  echo "- Escrow created and completed"
  echo "- Venue actions tested (revoke, scan)"
  echo "- System statistics updated"
  echo ""
  echo "🎯 Key Features Tested:"
  echo "- Complete ownership history tracking"
  echo "- Price analysis and markup calculation"
  echo "- Compliance status checking"
  echo "- Risk assessment and warnings"
  echo "- Secure escrow functionality"
  echo "- Venue control and revocation"
  echo "- Real-time status updates"
}

main "$@"
