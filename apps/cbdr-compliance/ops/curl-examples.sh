#!/bin/bash

# CBDR Compliance API - cURL Examples
# 
# This script demonstrates how to use the CBDR Compliance API
# for cross-border data transfer compliance checking.

set -e

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:8787/api/v1}"
API_KEY="${API_KEY:-}"

# Helper function to make API calls
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    
    local curl_cmd="curl -s -X $method"
    
    if [ -n "$API_KEY" ]; then
        curl_cmd="$curl_cmd -H 'X-API-Key: $API_KEY'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$API_BASE_URL$endpoint'"
    
    echo "Making request: $curl_cmd"
    eval $curl_cmd | jq .
    echo ""
}

echo "🌍 CBDR Compliance API Examples"
echo "================================"
echo ""

# 1. Health Check
echo "1. Health Check"
echo "---------------"
curl -s "$API_BASE_URL/../health" | jq .
echo ""

# 2. EU to US Transfer (Adequacy Decision)
echo "2. EU to US Transfer (Adequacy Decision)"
echo "----------------------------------------"
api_call "POST" "/transfer/check" '{
  "origin_country": "DE",
  "destination_country": "US",
  "vendor_id": "aws",
  "processing_context": {
    "controller": "Acme Corp GmbH",
    "purpose": "Cloud Storage",
    "data_categories": ["personal_data"],
    "special_categories": false
  },
  "claimed_legal_basis": "ART45_ADEQUACY",
  "transfer_date": "2025-09-21T16:00:00Z",
  "client_ref": "transfer-12345"
}'

# 3. EU to US Transfer (SCC)
echo "3. EU to US Transfer (SCC)"
echo "---------------------------"
api_call "POST" "/transfer/check" '{
  "origin_country": "FR",
  "destination_country": "US",
  "vendor_id": "aws",
  "processing_context": {
    "controller": "Acme Pharma SAS",
    "purpose": "Support Ticketing",
    "data_categories": ["personal_data", "contact_details"],
    "special_categories": false
  },
  "claimed_legal_basis": "ART46_SCC",
  "transfer_date": "2025-09-21T16:15:00Z",
  "client_ref": "st-88421"
}'

# 4. EU to India Transfer (Derogation)
echo "4. EU to India Transfer (Derogation)"
echo "------------------------------------"
api_call "POST" "/transfer/check" '{
  "origin_country": "IT",
  "destination_country": "IN",
  "vendor_id": "custom_processor_xyz",
  "processing_context": {
    "controller": "Acme Health S.p.A.",
    "purpose": "Urgent patient care",
    "data_categories": ["personal_data", "health_data"],
    "special_categories": true
  },
  "claimed_legal_basis": "ART49_DEROGATION",
  "transfer_date": "2025-09-21T16:20:00Z",
  "client_ref": "urgent-pt-5520"
}'

# 5. Get Vendor Information
echo "5. Get Vendor Information"
echo "-------------------------"
api_call "GET" "/vendors/aws"

# 6. Get Vendor Attestations
echo "6. Get Vendor Attestations"
echo "--------------------------"
api_call "GET" "/vendors/aws/attestations"

# 7. Get Adequacy Decisions
echo "7. Get Adequacy Decisions"
echo "-------------------------"
api_call "GET" "/regulatory/adequacy-decisions"

# 8. Get Adequacy Decision for US
echo "8. Get Adequacy Decision for US"
echo "-------------------------------"
api_call "GET" "/regulatory/adequacy-decisions/US"

# 9. Get SCC Updates
echo "9. Get SCC Updates"
echo "------------------"
api_call "GET" "/regulatory/scc-updates"

# 10. Get Transfer Statistics
echo "10. Get Transfer Statistics"
echo "---------------------------"
api_call "GET" "/stats/transfers?days=30"

# 11. Create Vendor Attestation (Example)
echo "11. Create Vendor Attestation (Example)"
echo "---------------------------------------"
api_call "POST" "/vendors/aws/attestations" '{
  "program": "SCC_Mod2_Mod3",
  "status": "active",
  "attestation_id": "att_aws_scc_m2m3_2025",
  "issued_date": "2025-01-01T00:00:00Z",
  "expiry_date": "2026-01-01T00:00:00Z",
  "modules": ["Module_Two", "Module_Three"],
  "certifications": ["SOC2", "ISO27001"]
}'

echo "✅ All examples completed!"
echo ""
echo "For more information, see:"
echo "- API Documentation: $API_BASE_URL/../docs"
echo "- OpenAPI Spec: $API_BASE_URL/../openapi.yaml"
echo "- GitHub: https://github.com/nullprotocol/cbdr-compliance"
