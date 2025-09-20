# Healthcare SDK Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Null Protocol Healthcare SDK in a HIPAA-compliant environment.

## Prerequisites

### Infrastructure Requirements
- Kubernetes cluster (1.20+) or Docker environment
- PostgreSQL 16+ with encryption enabled
- IPFS node for evidence storage
- Ethereum node or RPC provider
- SSL/TLS certificates
- Load balancer with health checks

### Security Requirements
- HIPAA-compliant infrastructure
- Encrypted storage and transmission
- Access controls and audit logging
- Regular security updates
- Incident response procedures

## Environment Setup

### 1. Database Configuration

```bash
# Create healthcare database
createdb healthcare_indexer

# Create user with appropriate permissions
psql healthcare_indexer -c "CREATE USER healthcare_user WITH PASSWORD 'secure-password';"
psql healthcare_indexer -c "GRANT ALL PRIVILEGES ON DATABASE healthcare_indexer TO healthcare_user;"

# Initialize schema
psql healthcare_indexer -f sql/001_init.sql
```

### 2. Environment Variables

```bash
# Copy environment template
cp env.example .env

# Configure environment variables
cat > .env << EOF
# Ethereum Configuration
RPC_URL=https://mainnet.infura.io/v3/your-project-id
CANON_HEALTH_ADDRESS=0xYourCanonHealthContract
RELAYER_PK=0xYourRelayerPrivateKey

# Database Configuration
PGHOST=your-db-host
PGPORT=5432
PGDATABASE=healthcare_indexer
PGUSER=healthcare_user
PGPASSWORD=your-secure-password

# IPFS Configuration
PINNER_BASE=http://ipfs:5001
PINNER_TOKEN=your-pinning-token

# HIPAA Compliance
PATIENT_SALT=your-secure-patient-salt
PROVIDER_SALT=your-secure-provider-salt

# API Configuration
PORT=8787
CORS_ORIGINS=https://patient.yourdomain.com,https://provider.yourdomain.com

# Security
API_KEY_SECRET=your-api-key-secret
JWT_SECRET=your-jwt-secret

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
      POSTGRES_DB: healthcare_indexer
      POSTGRES_USER: healthcare_user
      POSTGRES_PASSWORD: secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql/001_init.sql:/docker-entrypoint-initdb.d/001_init.sql
    ports:
      - "5432:5432"

  ipfs:
    image: ipfs/kubo:release
    ports:
      - "5001:5001"
      - "8080:8080"
    volumes:
      - ipfs_data:/data/ipfs

  healthcare-relayer:
    build: .
    environment:
      - RPC_URL=${RPC_URL}
      - CANON_HEALTH_ADDRESS=${CANON_HEALTH_ADDRESS}
      - RELAYER_PK=${RELAYER_PK}
      - PGHOST=postgres
      - PGPORT=5432
      - PGDATABASE=healthcare_indexer
      - PGUSER=healthcare_user
      - PGPASSWORD=secure-password
    ports:
      - "8787:8787"
    depends_on:
      - postgres
      - ipfs

  healthcare-indexer:
    build: .
    command: npm run indexer
    environment:
      - RPC_URL=${RPC_URL}
      - CANON_HEALTH_ADDRESS=${CANON_HEALTH_ADDRESS}
      - PGHOST=postgres
      - PGPORT=5432
      - PGDATABASE=healthcare_indexer
      - PGUSER=healthcare_user
      - PGPASSWORD=secure-password
    depends_on:
      - postgres

volumes:
  postgres_data:
  ipfs_data:
```

### Option 2: Kubernetes (Production)

```yaml
# k8s/healthcare-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: healthcare-relayer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: healthcare-relayer
  template:
    metadata:
      labels:
        app: healthcare-relayer
    spec:
      containers:
      - name: healthcare-relayer
        image: ghcr.io/your-org/healthcare-sdk:latest
        ports:
        - containerPort: 8787
        env:
        - name: RPC_URL
          valueFrom:
            secretKeyRef:
              name: healthcare-secrets
              key: rpc-url
        - name: CANON_HEALTH_ADDRESS
          valueFrom:
            secretKeyRef:
              name: healthcare-secrets
              key: canon-health-address
        - name: RELAYER_PK
          valueFrom:
            secretKeyRef:
              name: healthcare-secrets
              key: relayer-pk
        - name: PGHOST
          value: "postgres-service"
        - name: PGPORT
          value: "5432"
        - name: PGDATABASE
          value: "healthcare_indexer"
        - name: PGUSER
          valueFrom:
            secretKeyRef:
              name: healthcare-secrets
              key: db-user
        - name: PGPASSWORD
          valueFrom:
            secretKeyRef:
              name: healthcare-secrets
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

## Security Configuration

### 1. SSL/TLS Setup

```bash
# Generate SSL certificates
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Configure nginx with SSL
server {
    listen 443 ssl;
    server_name healthcare.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://healthcare-relayer:8787;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Database Security

```sql
-- Enable SSL for database connections
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/path/to/server.crt';
ALTER SYSTEM SET ssl_key_file = '/path/to/server.key';

-- Create audit role
CREATE ROLE healthcare_auditor;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO healthcare_auditor;

-- Enable row-level security
ALTER TABLE healthcare_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consent_status ENABLE ROW LEVEL SECURITY;
```

### 3. API Security

```typescript
// Implement rate limiting
app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (request) => request.ip
});

// Implement CORS
app.register(cors, {
  origin: ['https://patient.yourdomain.com', 'https://provider.yourdomain.com'],
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

## Monitoring & Alerting

### 1. Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'healthcare-relayer'
    static_configs:
      - targets: ['healthcare-relayer:8787']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

### 2. Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Healthcare SDK Dashboard",
    "panels": [
      {
        "title": "Consent Requests",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(consent_requests_total[5m])",
            "legendFormat": "Consent Requests/sec"
          }
        ]
      },
      {
        "title": "Data Access Logs",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(data_access_logs_total[5m])",
            "legendFormat": "Access Logs/sec"
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
- name: healthcare
  rules:
  - alert: HighConsentRevocationRate
    expr: rate(consent_revocations_total[5m]) > 0.1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High consent revocation rate detected"
      
  - alert: DataBreachDetected
    expr: increase(breach_reports_total[1m]) > 0
    for: 0m
    labels:
      severity: critical
    annotations:
      summary: "Data breach detected - immediate action required"
```

## Testing & Validation

### 1. Smoke Tests

```bash
# Run healthcare smoke tests
./ops/curl-examples.sh

# Expected output:
# ✅ Consent granted and revoked
# ✅ Medical record anchored
# ✅ Data access logged
# ✅ Audit trail maintained
# ✅ HIPAA compliance verified
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

# Run penetration test
nmap -sS -O healthcare.yourdomain.com

# Test SSL configuration
sslscan healthcare.yourdomain.com
```

## Maintenance & Updates

### 1. Regular Maintenance

```bash
# Database maintenance
psql healthcare_indexer -c "VACUUM ANALYZE;"
psql healthcare_indexer -c "REINDEX DATABASE healthcare_indexer;"

# Log rotation
logrotate /etc/logrotate.d/healthcare

# Security updates
apt update && apt upgrade -y
```

### 2. Backup Procedures

```bash
# Database backup
pg_dump healthcare_indexer > backup_$(date +%Y%m%d_%H%M%S).sql

# Configuration backup
tar -czf config_backup_$(date +%Y%m%d_%H%M%S).tar.gz .env docker-compose.yml

# IPFS backup
ipfs repo gc
```

### 3. Disaster Recovery

```bash
# Restore database
psql healthcare_indexer < backup_20240115_120000.sql

# Restore configuration
tar -xzf config_backup_20240115_120000.tar.gz

# Restart services
docker-compose restart
```

## Compliance & Auditing

### 1. HIPAA Compliance Checklist

- [x] Administrative safeguards implemented
- [x] Physical safeguards in place
- [x] Technical safeguards configured
- [x] Audit logging enabled
- [x] Access controls implemented
- [x] Encryption enabled
- [x] Incident response procedures
- [x] Regular security assessments

### 2. Audit Procedures

```bash
# Generate compliance report
./scripts/generate-compliance-report.sh

# Review access logs
psql healthcare_indexer -c "SELECT * FROM audit_log WHERE timestamp >= NOW() - INTERVAL '24 hours';"

# Check consent status
psql healthcare_indexer -c "SELECT * FROM patient_consent_status WHERE updated_at >= NOW() - INTERVAL '7 days';"
```

### 3. Incident Response

```bash
# Incident response checklist
1. Identify and contain the incident
2. Assess the scope and impact
3. Notify affected parties
4. Document the incident
5. Implement corrective measures
6. Review and update procedures
```

## Support & Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database connectivity
   psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -c "SELECT 1;"
   ```

2. **IPFS Connection Issues**
   ```bash
   # Check IPFS status
   curl http://ipfs:5001/api/v0/id
   ```

3. **Ethereum Connection Issues**
   ```bash
   # Check Ethereum connectivity
   curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' $RPC_URL
   ```

### Support Contacts

- **Technical Support**: healthcare-support@nullprotocol.org
- **Security Issues**: security@nullprotocol.org
- **Compliance Questions**: compliance@nullprotocol.org
- **Emergency**: +1-XXX-XXX-XXXX

## Conclusion

This deployment guide provides comprehensive instructions for deploying the Null Protocol Healthcare SDK in a HIPAA-compliant environment. Follow these steps carefully and ensure all security requirements are met before going live.

For additional support or questions, please contact our healthcare team at healthcare@nullprotocol.org.
