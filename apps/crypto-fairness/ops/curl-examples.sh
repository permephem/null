#!/bin/bash

# Null Protocol Crypto Fairness Relayer - API Examples
# This script demonstrates how to use the Crypto Fairness Relayer API

# Configuration
API_BASE_URL="http://localhost:8787"
API_KEY="your-secret-api-key"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Null Protocol Crypto Fairness Relayer - API Examples${NC}"
echo "=================================================="

# Health Check
echo -e "\n${YELLOW}1. Health Check${NC}"
echo "GET /healthz"
curl -s -X GET "${API_BASE_URL}/healthz" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" | jq '.'

# Create a probe for an NFT mint
echo -e "\n${YELLOW}2. Create Probe for NFT Mint${NC}"
echo "POST /probe/create"
PROBE_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/probe/create" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "nft_mint_example_2025_01_20",
    "eventType": "nft_mint",
    "chain": "ethereum",
    "contractAddress": "0x1234567890123456789012345678901234567890",
    "startTime": "2025-01-20T10:00:00Z",
    "endTime": "2025-01-20T12:00:00Z",
    "probeConfig": {
      "mempoolMonitoring": true,
      "mevDetection": true,
      "botDetection": true,
      "timingAnalysis": true,
      "sampleSize": 100
    }
  }')

echo "$PROBE_RESPONSE" | jq '.'

# Extract probe ID from response
PROBE_ID=$(echo "$PROBE_RESPONSE" | jq -r '.probeId')

if [ "$PROBE_ID" != "null" ] && [ "$PROBE_ID" != "" ]; then
  echo -e "\n${GREEN}✅ Probe created successfully with ID: ${PROBE_ID}${NC}"
  
  # Get probe status
  echo -e "\n${YELLOW}3. Get Probe Status${NC}"
  echo "GET /probe/${PROBE_ID}/status"
  curl -s -X GET "${API_BASE_URL}/probe/${PROBE_ID}/status" \
    -H "X-API-Key: ${API_KEY}" \
    -H "Content-Type: application/json" | jq '.'
else
  echo -e "\n${RED}❌ Failed to create probe${NC}"
fi

# Create a probe for a token launch
echo -e "\n${YELLOW}4. Create Probe for Token Launch${NC}"
echo "POST /probe/create"
TOKEN_PROBE_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/probe/create" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "token_launch_example_2025_01_20",
    "eventType": "token_launch",
    "chain": "polygon",
    "contractAddress": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    "startTime": "2025-01-20T14:00:00Z",
    "endTime": "2025-01-20T16:00:00Z",
    "probeConfig": {
      "mempoolMonitoring": true,
      "mevDetection": true,
      "botDetection": true,
      "timingAnalysis": true,
      "sampleSize": 200
    }
  }')

echo "$TOKEN_PROBE_RESPONSE" | jq '.'

# Get fairness index
echo -e "\n${YELLOW}5. Get Fairness Index${NC}"
echo "GET /fairness-index"
curl -s -X GET "${API_BASE_URL}/fairness-index?chain=ethereum&eventType=nft_mint&limit=10&offset=0" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" | jq '.'

# Get violation statistics
echo -e "\n${YELLOW}6. Get Violation Statistics${NC}"
echo "GET /violations/stats"
curl -s -X GET "${API_BASE_URL}/violations/stats?chain=ethereum&violationType=bot_concentration" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" | jq '.'

# Get mempool statistics
echo -e "\n${YELLOW}7. Get Mempool Statistics${NC}"
echo "GET /mempool/stats"
curl -s -X GET "${API_BASE_URL}/mempool/stats" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" | jq '.'

# Get active probes
echo -e "\n${YELLOW}8. Get Active Probes${NC}"
echo "GET /probes/active"
curl -s -X GET "${API_BASE_URL}/probes/active" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" | jq '.'

# Create an attestation (example with mock data)
echo -e "\n${YELLOW}9. Create Attestation${NC}"
echo "POST /attestation/create"
curl -s -X POST "${API_BASE_URL}/attestation/create" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "nft_mint_example_2025_01_20",
    "fairnessAnalysis": {
      "eventId": "nft_mint_example_2025_01_20",
      "eventType": "nft_mint",
      "chain": "ethereum",
      "contractAddress": "0x1234567890123456789012345678901234567890",
      "startBlock": 19000000,
      "endBlock": 19000100,
      "totalSupply": "10000",
      "totalParticipants": 150,
      "analysisTimestamp": "2025-01-20T12:00:00Z",
      "overallScore": 85,
      "scoreCategory": "good",
      "violations": [
        {
          "violationId": "bot_concentration_001",
          "type": "bot_concentration",
          "severity": "medium",
          "description": "Detected 5 wallets with suspicious transaction patterns",
          "evidence": {
            "transactionHashes": ["0xabc123..."],
            "walletAddresses": ["0xdef456..."],
            "blockNumbers": [19000050],
            "timestamp": "2025-01-20T11:30:00Z"
          },
          "impact": {
            "affectedWallets": 5,
            "affectedSupply": 500,
            "estimatedLoss": "0"
          },
          "confidence": 0.8
        }
      ],
      "walletClusters": [],
      "concentrationMetrics": {
        "giniCoefficient": 0.65,
        "top10Percent": 25.5,
        "top1Percent": 8.2,
        "herfindahlIndex": 0.15
      },
      "mevMetrics": {
        "sandwichAttacks": 0,
        "frontRunningTxs": 2,
        "backRunningTxs": 0,
        "privateRelayUsage": 0
      },
      "timingMetrics": {
        "averageConfirmationTime": 12.5,
        "medianConfirmationTime": 10.0,
        "fastestConfirmation": 2.1,
        "slowestConfirmation": 45.3
      },
      "evidence": {
        "manifestHash": "0x1234567890abcdef...",
        "ipfsUri": "ipfs://QmExampleHash...",
        "reproducibleNotebook": "ipfs://QmNotebookHash...",
        "rawDataHash": "0xabcdef1234567890..."
      }
    },
    "attestorAddress": "0x9876543210987654321098765432109876543210",
    "nullTokenPayment": {
      "amount": "1000000000000000000",
      "transactionHash": "0xpayment1234567890abcdef..."
    }
  }' | jq '.'

echo -e "\n${GREEN}✅ API examples completed!${NC}"
echo -e "\n${BLUE}📚 For more information, visit: https://docs.nullprotocol.org${NC}"
echo -e "${BLUE}🔗 GitHub: https://github.com/null-protocol/crypto-fairness-relayer${NC}"
