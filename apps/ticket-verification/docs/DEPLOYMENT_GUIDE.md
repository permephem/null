# Canon Ticket Verification Flow Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Canon Ticket Verification Flow ("Carfax for Tickets") system that provides complete transparency and trust in the ticket resale market.

## Prerequisites

### Infrastructure Requirements
- Kubernetes cluster (1.20+) or Docker environment
- PostgreSQL 16+ with encryption enabled
- IPFS node for evidence storage
- Ethereum node or RPC provider
- SSL/TLS certificates
- Load balancer with health checks

### Smart Contract Requirements
- CanonTicketVerification contract deployed
- Proper role assignments (VENUE_ROLE, VERIFIER_ROLE, ESCROW_ROLE)
- Sufficient ETH for gas fees
- Authorized exchanges configured

## Environment Setup

### 1. Database Configuration

```bash
# Create ticket verification database
createdb ticket_verification

# Create user with appropriate permissions
psql ticket_verification -c "CREATE USER ticket_user WITH PASSWORD 'secure-password';"
psql ticket_verification -c "GRANT ALL PRIVILEGES ON DATABASE ticket_verification TO ticket_user;"

# Initialize schema (if needed)
psql ticket_verification -f sql/001_init.sql
```

### 2. Environment Variables

```bash
# Copy environment template
cp env.example .env

# Configure environment variables
cat > .env << EOF
# Ethereum Configuration
RPC_URL=https://mainnet.infura.io/v3/your-project-id
CANON_TICKET_ADDRESS=0xYourCanonTicketVerificationContract
RELAYER_PK=0xYourRelayerPrivateKey

# Database Configuration
PGHOST=your-db-host
PGPORT=5432
PGDATABASE=ticket_verification
PGUSER=ticket_user
PGPASSWORD=your-secure-password

# IPFS Configuration
PINNER_BASE=http://ipfs:5001
PINNER_TOKEN=your-pinning-token

# API Configuration
PORT=8787
CORS_ORIGINS=https://buyer.yourdomain.com,https://seller.yourdomain.com

# Security
API_KEY_SECRET=your-api-key-secret
JWT_SECRET=your-jwt-secret

# Escrow Configuration
ESCROW_TIMEOUT_HOURS=24
MIN_ESCROW_AMOUNT=1000000000000000
MAX_ESCROW_AMOUNT=10000000000000000000

# Monitoring
ENABLE_METRICS=true
LOG_LEVEL=info
EOF
```

## Deployment Options

### Option 1: Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ticket_verification
      POSTGRES_USER: ticket_user
      POSTGRES_PASSWORD: secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  ipfs:
    image: ipfs/kubo:release
    ports:
      - "5001:5001"
      - "8080:8080"
    volumes:
      - ipfs_data:/data/ipfs

  ticket-verification:
    build: .
    environment:
      - RPC_URL=${RPC_URL}
      - CANON_TICKET_ADDRESS=${CANON_TICKET_ADDRESS}
      - RELAYER_PK=${RELAYER_PK}
      - PGHOST=postgres
      - PGPORT=5432
      - PGDATABASE=ticket_verification
      - PGUSER=ticket_user
      - PGPASSWORD=secure-password
    ports:
      - "8787:8787"
    depends_on:
      - postgres
      - ipfs

volumes:
  postgres_data:
  ipfs_data:
```

### Option 2: Kubernetes (Production)

```yaml
# k8s/ticket-verification-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ticket-verification
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ticket-verification
  template:
    metadata:
      labels:
        app: ticket-verification
    spec:
      containers:
      - name: ticket-verification
        image: ghcr.io/your-org/ticket-verification:latest
        ports:
        - containerPort: 8787
        env:
        - name: RPC_URL
          valueFrom:
            secretKeyRef:
              name: ticket-verification-secrets
              key: rpc-url
        - name: CANON_TICKET_ADDRESS
          valueFrom:
            secretKeyRef:
              name: ticket-verification-secrets
              key: canon-ticket-address
        - name: RELAYER_PK
          valueFrom:
            secretKeyRef:
              name: ticket-verification-secrets
              key: relayer-pk
        - name: PGHOST
          value: "postgres-service"
        - name: PGPORT
          value: "5432"
        - name: PGDATABASE
          value: "ticket_verification"
        - name: PGUSER
          valueFrom:
            secretKeyRef:
              name: ticket-verification-secrets
              key: db-user
        - name: PGPASSWORD
          valueFrom:
            secretKeyRef:
              name: ticket-verification-secrets
              key: db-password
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8787
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /healthz
            port: 8787
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Smart Contract Setup

### 1. Deploy CanonTicketVerification Contract

```solidity
// Deploy the contract
CanonTicketVerification verification = new CanonTicketVerification();

// Grant roles
verification.grantRole(verification.VENUE_ROLE(), venueAddress);
verification.grantRole(verification.VERIFIER_ROLE(), verifierAddress);
verification.grantRole(verification.ESCROW_ROLE(), escrowAddress);
```

### 2. Configure Authorized Exchanges

```solidity
// Authorize exchanges
verification.updateExchangeAuthorization("StubHub", true);
verification.updateExchangeAuthorization("Ticketmaster", true);
verification.updateExchangeAuthorization("Vivid Seats", true);
verification.updateExchangeAuthorization("SeatGeek", true);
```

### 3. Set Up Venue Rules

```solidity
// Issue ticket with rules
verification.issueTicket(
  buyer,
  TicketMetadata({
    eventId: "CONCERT-2024-01-15",
    seatLocation: "Section A, Row 5, Seat 12",
    originalPrice: 15000, // $150.00 in cents
    maxResaleMarkup: 110, // 10% markup allowed
    authorizedExchanges: ["StubHub", "Ticketmaster"],
    validUntil: 1705334400, // Unix timestamp
    issuer: venueAddress,
    issuedAt: block.timestamp
  }),
  "ipfs://QmTicketMetadata..."
);
```

## Security Configuration

### 1. SSL/TLS Setup

```bash
# Generate SSL certificates
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Configure nginx with SSL
server {
    listen 443 ssl;
    server_name verification.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://ticket-verification:8787;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. API Security

```typescript
// Implement rate limiting
app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (request) => request.ip
});

// Implement CORS
app.register(cors, {
  origin: ['https://buyer.yourdomain.com', 'https://seller.yourdomain.com'],
  credentials: true
});

// Implement API key validation
app.addHook('preHandler', async (request, reply) => {
  const apiKey = request.headers['x-api-key'];
  if (!await validateApiKey(apiKey)) {
    return reply.code(401).send({ error: 'Invalid API key' });
  }
});
```

## Testing & Validation

### 1. Smoke Tests

```bash
# Run ticket verification smoke tests
./ops/curl-examples.sh

# Expected output:
# ✅ Ticket history retrieved (Carfax-like report)
# ✅ Ticket status verified
# ✅ Pre-purchase verification completed
# ✅ Escrow created and completed
# ✅ Venue actions tested (revoke, scan)
# ✅ System statistics updated
```

### 2. Load Testing

```bash
# Install k6
curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz --strip-components 1

# Run load test
k6 run --vus 10 --duration 30s load-test.js
```

### 3. Security Testing

```bash
# Run security scan
npm audit

# Test SSL configuration
sslscan verification.yourdomain.com

# Test API endpoints
curl -X GET https://verification.yourdomain.com/healthz
```

## Monitoring & Alerting

### 1. Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ticket-verification'
    static_configs:
      - targets: ['ticket-verification:8787']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

### 2. Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Ticket Verification Dashboard",
    "panels": [
      {
        "title": "Verification Requests",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(verification_requests_total[5m])",
            "legendFormat": "Verification Requests/sec"
          }
        ]
      },
      {
        "title": "Escrow Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(escrow_completions_total[5m]) / rate(escrow_creations_total[5m])",
            "legendFormat": "Escrow Success Rate"
          }
        ]
      }
    ]
  }
}
```

### 3. Alert Rules

```yaml
# alerts.yml
groups:
- name: ticket-verification
  rules:
  - alert: HighVerificationFailureRate
    expr: rate(verification_failures_total[5m]) / rate(verification_requests_total[5m]) > 0.1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High ticket verification failure rate detected"
      
  - alert: EscrowTimeoutHigh
    expr: rate(escrow_timeouts_total[5m]) > 0.05
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High escrow timeout rate detected"
```

## Use Cases & Examples

### 1. Buyer Verification Flow

```typescript
// 1. Get ticket history (Carfax-like report)
const history = await fetch(`/tickets/${ticketId}/history`);
const report = await history.json();

// 2. Verify ticket before purchase
const verification = await fetch(`/tickets/${ticketId}/verify`, {
  method: 'POST',
  body: JSON.stringify({
    ticketId,
    buyerAddress: '0xBuyerAddress123',
    sellerAddress: report.currentOwner
  })
});

// 3. Create escrow if verification passes
if (verification.isValid && verification.riskLevel === 'LOW') {
  const escrow = await fetch('/escrow/create', {
    method: 'POST',
    body: JSON.stringify({
      ticketId,
      sellerAddress: report.currentOwner,
      amount: (report.priceAnalysis.currentPrice * 1e18).toString(),
      expiresAt: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    })
  });
}
```

### 2. Venue Management

```typescript
// Revoke fraudulent ticket
await fetch(`/tickets/${ticketId}/revoke`, {
  method: 'POST',
  headers: { 'x-api-key': venueApiKey },
  body: JSON.stringify({
    ticketId,
    reason: 'Fraudulent activity detected'
  })
});

// Mark ticket as used at venue
await fetch(`/tickets/${ticketId}/scan`, {
  method: 'POST',
  headers: { 'x-api-key': venueApiKey }
});
```

### 3. Marketplace Integration

```typescript
// Check ticket status before listing
const status = await fetch(`/tickets/${ticketId}/status`);
const ticketStatus = await status.json();

if (ticketStatus.status === 'VALID' && ticketStatus.owner === sellerAddress) {
  // Allow listing
  await listTicket(ticketId, price);
} else {
  // Reject listing
  throw new Error('Invalid ticket or unauthorized seller');
}
```

## Maintenance & Updates

### 1. Regular Maintenance

```bash
# Database maintenance
psql ticket_verification -c "VACUUM ANALYZE;"
psql ticket_verification -c "REINDEX DATABASE ticket_verification;"

# Log rotation
logrotate /etc/logrotate.d/ticket-verification

# Security updates
apt update && apt upgrade -y
```

### 2. Backup Procedures

```bash
# Database backup
pg_dump ticket_verification > backup_$(date +%Y%m%d_%H%M%S).sql

# Configuration backup
tar -czf config_backup_$(date +%Y%m%d_%H%M%S).tar.gz .env docker-compose.yml

# IPFS backup
ipfs repo gc
```

### 3. Disaster Recovery

```bash
# Restore database
psql ticket_verification < backup_20240115_120000.sql

# Restore configuration
tar -xzf config_backup_20240115_120000.tar.gz

# Restart services
docker-compose restart
```

## Support & Troubleshooting

### Common Issues

1. **Smart Contract Connection Issues**
   ```bash
   # Check Ethereum connectivity
   curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' $RPC_URL
   ```

2. **Database Connection Issues**
   ```bash
   # Check database connectivity
   psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -c "SELECT 1;"
   ```

3. **IPFS Connection Issues**
   ```bash
   # Check IPFS status
   curl http://ipfs:5001/api/v0/id
   ```

### Support Contacts

- **Technical Support**: verification-support@nullprotocol.org
- **Security Issues**: security@nullprotocol.org
- **Smart Contract Issues**: contracts@nullprotocol.org
- **Emergency**: +1-XXX-XXX-XXXX

## Conclusion

This deployment guide provides comprehensive instructions for deploying the Canon Ticket Verification Flow system. The system provides:

- **Complete transparency**: Full ticket history and ownership chain
- **Buyer protection**: Pre-purchase verification and escrow
- **Venue control**: Revocation and compliance monitoring
- **Marketplace trust**: Verified sellers and compliant transfers

Follow these steps carefully and ensure all security requirements are met before going live.

For additional support or questions, please contact our verification team at verification@nullprotocol.org.
