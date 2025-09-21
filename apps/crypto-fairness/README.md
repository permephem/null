# 🚀 Null Protocol Crypto Fairness Relayer

A distributed monitoring system for crypto fairness in NFT mints, token launches, airdrops, and other blockchain events. Built on the Null Protocol framework for verifiable, tamper-evident fairness attestations.

## 🎯 Overview

The Crypto Fairness Relayer monitors blockchain events in real-time to detect:
- **Bot concentration** and sybil attacks
- **MEV violations** (sandwich attacks, front-running)
- **Timing manipulation** and unfair allocation
- **Backdoor allowlists** and insider advantages
- **Supply concentration** and distribution fairness

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Mempool        │    │  Probe          │    │  Fairness       │
│  Monitor        │───▶│  Orchestrator   │───▶│  Analyzer       │
│  (Real-time)    │    │  (Distributed)  │    │  (Scoring)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  MEV Detection  │    │  Evidence       │    │  Attestation    │
│  (Patterns)     │    │  Collection     │    │  Generation     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Redis (for job queues)
- PostgreSQL (for data storage)
- RPC endpoints for supported chains

### Installation

```bash
# Clone the repository
git clone https://github.com/null-protocol/crypto-fairness-relayer.git
cd crypto-fairness-relayer

# Install dependencies
npm install

# Copy environment configuration
cp env.example .env

# Configure your environment variables
nano .env
```

### Configuration

Edit `.env` with your configuration:

```bash
# Server Configuration
PORT=8787
HOST=0.0.0.0
NODE_ENV=development

# Blockchain RPC URLs
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY
OPTIMISM_RPC_URL=https://opt-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Probe Configuration
PROBE_PRIVATE_KEY_1=0x...
PROBE_PRIVATE_KEY_2=0x...
PROBE_PRIVATE_KEY_3=0x...

# Null Protocol Integration
NULL_TOKEN_ADDRESS=0x...
CANON_REGISTRY_ADDRESS=0x...
FAIRNESS_REGISTRY_ADDRESS=0x...

# API Security
API_KEY_SECRET=your-secret-api-key
```

### Running the Relayer

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## 📡 API Endpoints

### Health Check
```bash
GET /healthz
```

### Create Probe
```bash
POST /probe/create
Content-Type: application/json
X-API-Key: your-api-key

{
  "eventId": "nft_mint_2025_01_20",
  "eventType": "nft_mint",
  "chain": "ethereum",
  "contractAddress": "0x...",
  "startTime": "2025-01-20T10:00:00Z",
  "endTime": "2025-01-20T12:00:00Z",
  "probeConfig": {
    "mempoolMonitoring": true,
    "mevDetection": true,
    "botDetection": true,
    "timingAnalysis": true,
    "sampleSize": 100
  }
}
```

### Get Probe Status
```bash
GET /probe/{probeId}/status
X-API-Key: your-api-key
```

### Get Event Analysis
```bash
GET /analysis/{eventId}
X-API-Key: your-api-key
```

### Create Attestation
```bash
POST /attestation/create
Content-Type: application/json
X-API-Key: your-api-key

{
  "eventId": "nft_mint_2025_01_20",
  "fairnessAnalysis": { ... },
  "attestorAddress": "0x...",
  "nullTokenPayment": {
    "amount": "1000000000000000000",
    "transactionHash": "0x..."
  }
}
```

### Get Fairness Index
```bash
GET /fairness-index?chain=ethereum&eventType=nft_mint&limit=50&offset=0
X-API-Key: your-api-key
```

### Get Violation Statistics
```bash
GET /violations/stats?chain=ethereum&violationType=bot_concentration
X-API-Key: your-api-key
```

## 🔍 Fairness Analysis

### Scoring Algorithm

The fairness score is calculated using weighted components:

- **Concentration (40%)**: Gini coefficient, top percentiles, Herfindahl index
- **MEV (30%)**: Sandwich attacks, front-running, arbitrage
- **Bot Detection (20%)**: Wallet clustering, behavioral patterns
- **Timing (10%)**: Transaction timing analysis

### Score Categories

- **Excellent (90-100)**: Minimal violations, fair distribution
- **Good (75-89)**: Minor issues, generally fair
- **Fair (60-74)**: Some concerns, room for improvement
- **Poor (0-59)**: Significant violations, unfair practices

### Violation Types

- **Bot Concentration**: Wallets with suspicious transaction patterns
- **MEV Front Running**: Transactions that anticipate and exploit others
- **Sandwich Attack**: Buy-sell patterns that manipulate prices
- **Backdoor Allowlist**: Unfair allocation to insiders
- **Premined Supply**: Supply allocated before public launch
- **Sybil Attack**: Multiple wallets controlled by same entity
- **Timing Manipulation**: Coordinated transaction timing
- **Private Relay Abuse**: Unfair use of private mempools

## 🛡️ Evidence Collection

### Mempool Monitoring

- Real-time transaction monitoring
- MEV pattern detection
- Private relay correlation
- Gas price analysis

### On-Chain Analysis

- Transaction receipt analysis
- Block inclusion patterns
- Contract interaction analysis
- Token transfer tracking

### Evidence Bundle

Each analysis generates a tamper-evident evidence bundle:

```json
{
  "eventId": "nft_mint_2025_01_20",
  "manifestHash": "0x...",
  "ipfsUri": "ipfs://Qm...",
  "artifacts": {
    "mempoolTraces": ["ipfs://Qm..."],
    "transactionReceipts": ["ipfs://Qm..."],
    "blockData": ["ipfs://Qm..."],
    "analysisNotebook": "ipfs://Qm...",
    "screenshots": ["ipfs://Qm..."]
  },
  "metadata": {
    "createdAt": "2025-01-20T12:00:00Z",
    "version": "1.0.0",
    "chain": "ethereum",
    "blockRange": [19000000, 19000100]
  }
}
```

## 🔗 Null Protocol Integration

### Canon Registry

All fairness analyses are inscribed into the Null Protocol Canon Registry:

- **Seal**: Cryptographic proof of analysis
- **Mask**: Fairness Mask NFT for compliant projects
- **Oblivion Marker**: Structured metadata about violations
- **Obol**: NULL token payment for attestation

### Token Economics

- **Consumers**: Free access to fairness monitoring
- **Enterprises**: Pay in fiat for detailed analysis
- **Protocol**: Receives NULL token payments (1/13 tithe)
- **Implementers**: Receive 12/13 of NULL token payments

## 🚀 Deployment

### Docker Deployment

```bash
# Build image
docker build -t crypto-fairness-relayer .

# Run container
docker run -d \
  --name crypto-fairness-relayer \
  -p 8787:8787 \
  --env-file .env \
  crypto-fairness-relayer
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: crypto-fairness-relayer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: crypto-fairness-relayer
  template:
    metadata:
      labels:
        app: crypto-fairness-relayer
    spec:
      containers:
      - name: relayer
        image: crypto-fairness-relayer:latest
        ports:
        - containerPort: 8787
        env:
        - name: PORT
          value: "8787"
        - name: NODE_ENV
          value: "production"
```

## 📊 Monitoring & Observability

### Metrics

- Probe execution time
- Mempool transaction volume
- MEV pattern detection rate
- Fairness score distribution
- API response times

### Logging

- Structured JSON logging
- Request/response logging
- Error tracking
- Performance metrics

### Health Checks

- Service health endpoints
- Database connectivity
- RPC endpoint status
- Memory and CPU usage

## 🔒 Security

### API Security

- API key authentication
- Rate limiting
- Request validation
- CORS configuration

### Data Protection

- No PII collection
- Encrypted evidence storage
- Secure key management
- Audit logging

### Network Security

- TLS encryption
- Firewall configuration
- VPN access for probes
- DDoS protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

Apache-2.0 License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- Documentation: [docs.nullprotocol.org](https://docs.nullprotocol.org)
- Discord: [discord.gg/nullprotocol](https://discord.gg/nullprotocol)
- Email: support@nullprotocol.org

## 🗺️ Roadmap

### Phase 1 (Q1 2025)
- ✅ Core mempool monitoring
- ✅ Basic fairness analysis
- ✅ API endpoints
- ✅ Evidence collection

### Phase 2 (Q2 2025)
- 🔄 Advanced MEV detection
- 🔄 Machine learning bot detection
- 🔄 Multi-chain support
- 🔄 Enterprise dashboard

### Phase 3 (Q3 2025)
- 📋 Real-time alerts
- 📋 Automated attestations
- 📋 Regulatory reporting
- 📋 Mobile app

### Phase 4 (Q4 2025)
- 📋 Global deployment
- 📋 Advanced analytics
- 📋 Integration partnerships
- 📋 Market transformation

---

**Built with ❤️ by the Null Protocol team**
