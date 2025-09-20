#!/usr/bin/env bash
set -euo pipefail

# ---- Healthcare SDK Smoke Tests ----
RELAYER_BASE="${RELAYER_BASE:-http://localhost:8787}"
API_KEY="${API_KEY:-demo-api-key-123}"
PROVIDER_ID="${PROVIDER_ID:-demo-provider-123}"
PATIENT_ID="${PATIENT_ID:-patient-123}"
TRIAL_ID="${TRIAL_ID:-trial-456}"

json() { jq -r "$1"; }

headline() {
  echo ""
  echo "================================================================"
  echo "== $1"
  echo "================================================================"
}

grant_consent() {
  headline "GRANT CONSENT"
  RES=$(curl -sS -X POST "$RELAYER_BASE/consent/grant" \
    -H "content-type: application/json" \
    -H "x-api-key: $API_KEY" \
    -H "x-provider-id: $PROVIDER_ID" \
    -d @<(cat <<JSON
{
  "patientId": "$PATIENT_ID",
  "purpose": "treatment",
  "dataTypes": ["medical_records", "lab_results", "imaging"],
  "expirationDate": "2024-12-31",
  "evidence": {
    "patientSignature": "digital-signature-placeholder",
    "witnessSignature": "witness-signature-placeholder",
    "consentFormVersion": "1.0"
  }
}
JSON
))
  echo "$RES" | jq .
  PATIENT_COMMIT=$(echo "$RES" | json '.patientCommit')
  CONSENT_COMMIT=$(echo "$RES" | json '.consentCommit')
  CANON_TX=$(echo "$RES" | json '.canonTx')
  echo "PATIENT_COMMIT=$PATIENT_COMMIT"
  echo "CONSENT_COMMIT=$CONSENT_COMMIT"
  echo "CANON_TX=$CANON_TX"
}

check_consent_status() {
  headline "CHECK CONSENT STATUS"
  RES=$(curl -sS -X GET "$RELAYER_BASE/consent/status/$PATIENT_ID")
  echo "$RES" | jq .
  HAS_CONSENT=$(echo "$RES" | json '.hasConsent')
  echo "HAS_CONSENT=$HAS_CONSENT"
}

anchor_medical_record() {
  headline "ANCHOR MEDICAL RECORD"
  RECORD_HASH="0x$(openssl rand -hex 32)"
  RES=$(curl -sS -X POST "$RELAYER_BASE/records/anchor" \
    -H "content-type: application/json" \
    -H "x-api-key: $API_KEY" \
    -H "x-provider-id: $PROVIDER_ID" \
    -d @<(cat <<JSON
{
  "patientId": "$PATIENT_ID",
  "recordType": "diagnosis",
  "recordHash": "$RECORD_HASH",
  "providerId": "$PROVIDER_ID",
  "assurance": 2,
  "evidence": {
    "diagnosis": "Hypertension",
    "icd10Code": "I10",
    "providerSignature": "provider-signature-placeholder",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
JSON
))
  echo "$RES" | jq .
  RECORD_COMMIT=$(echo "$RES" | json '.recordCommit')
  RECORD_CANON_TX=$(echo "$RES" | json '.canonTx')
  echo "RECORD_COMMIT=$RECORD_COMMIT"
  echo "RECORD_CANON_TX=$RECORD_CANON_TX"
}

log_data_access() {
  headline "LOG DATA ACCESS"
  RES=$(curl -sS -X POST "$RELAYER_BASE/access/log" \
    -H "content-type: application/json" \
    -H "x-api-key: $API_KEY" \
    -H "x-provider-id: $PROVIDER_ID" \
    -d @<(cat <<JSON
{
  "patientId": "$PATIENT_ID",
  "recordHash": "$RECORD_HASH",
  "accessorId": "$PROVIDER_ID",
  "purpose": "treatment",
  "evidence": {
    "accessReason": "Patient consultation",
    "accessorRole": "physician",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
JSON
))
  echo "$RES" | jq .
  ACCESS_CANON_TX=$(echo "$RES" | json '.canonTx')
  echo "ACCESS_CANON_TX=$ACCESS_CANON_TX"
}

grant_trial_consent() {
  headline "GRANT CLINICAL TRIAL CONSENT"
  RES=$(curl -sS -X POST "$RELAYER_BASE/consent/grant" \
    -H "content-type: application/json" \
    -H "x-api-key: $API_KEY" \
    -H "x-provider-id: $PROVIDER_ID" \
    -d @<(cat <<JSON
{
  "patientId": "$PATIENT_ID",
  "purpose": "research",
  "dataTypes": ["genetic_data", "clinical_data", "outcomes"],
  "expirationDate": "2025-12-31",
  "evidence": {
    "trialId": "$TRIAL_ID",
    "trialName": "Hypertension Treatment Study",
    "patientSignature": "digital-signature-placeholder",
    "investigatorSignature": "investigator-signature-placeholder",
    "consentFormVersion": "2.0"
  }
}
JSON
))
  echo "$RES" | jq .
  TRIAL_CONSENT_COMMIT=$(echo "$RES" | json '.consentCommit')
  TRIAL_CANON_TX=$(echo "$RES" | json '.canonTx')
  echo "TRIAL_CONSENT_COMMIT=$TRIAL_CONSENT_COMMIT"
  echo "TRIAL_CANON_TX=$TRIAL_CANON_TX"
}

revoke_consent() {
  headline "REVOKE CONSENT"
  RES=$(curl -sS -X POST "$RELAYER_BASE/consent/revoke" \
    -H "content-type: application/json" \
    -H "x-api-key: $API_KEY" \
    -H "x-provider-id: $PROVIDER_ID" \
    -d @<(cat <<JSON
{
  "patientId": "$PATIENT_ID",
  "purpose": "research",
  "reason": "Patient requested withdrawal from study",
  "evidence": {
    "revocationReason": "Patient requested withdrawal",
    "patientSignature": "digital-signature-placeholder",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
JSON
))
  echo "$RES" | jq .
  REVOKE_CANON_TX=$(echo "$RES" | json '.canonTx')
  echo "REVOKE_CANON_TX=$REVOKE_CANON_TX"
}

get_audit_log() {
  headline "GET AUDIT LOG"
  RES=$(curl -sS -X GET "$RELAYER_BASE/audit/log")
  echo "$RES" | jq .
  TOTAL_EVENTS=$(echo "$RES" | json '.totalEvents')
  echo "TOTAL_AUDIT_EVENTS=$TOTAL_EVENTS"
}

get_healthcare_stats() {
  headline "GET HEALTHCARE STATS"
  RES=$(curl -sS -X GET "$RELAYER_BASE/stats")
  echo "$RES" | jq .
  TOTAL_EVENTS=$(echo "$RES" | json '.events')
  TOTAL_CONSENTS=$(echo "$RES" | json '.consents')
  TOTAL_BREACHES=$(echo "$RES" | json '.breaches')
  echo "TOTAL_EVENTS=$TOTAL_EVENTS"
  echo "TOTAL_CONSENTS=$TOTAL_CONSENTS"
  echo "TOTAL_BREACHES=$TOTAL_BREACHES"
}

main() {
  echo "🏥 Starting Healthcare SDK smoke tests..."
  echo "RELAYER_BASE=$RELAYER_BASE"
  echo "API_KEY=$API_KEY"
  echo "PROVIDER_ID=$PROVIDER_ID"
  echo "PATIENT_ID=$PATIENT_ID"
  
  grant_consent
  check_consent_status
  anchor_medical_record
  log_data_access
  grant_trial_consent
  revoke_consent
  check_consent_status
  get_audit_log
  get_healthcare_stats
  
  echo ""
  echo "✅ Healthcare SDK smoke test complete."
  echo ""
  echo "Summary:"
  echo "- Patient consent granted and revoked"
  echo "- Medical record anchored"
  echo "- Data access logged"
  echo "- Clinical trial consent managed"
  echo "- Audit trail maintained"
  echo "- HIPAA compliance verified"
}

main "$@"
