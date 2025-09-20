# Kubernetes Deployment Guide

## Prerequisites

- Kubernetes cluster (1.20+)
- Helm 3.x
- kubectl configured
- Container registry access

## Quick Start

```bash
# Install the chart
helm upgrade --install null-protocol ./null-protocol \
  --values ./null-protocol/values.yaml \
  --set global.imageTag=latest

# Check deployment status
kubectl get pods -l app.kubernetes.io/name=relayer-tickets

# View logs
kubectl logs -l app=relayer -f
```

## Configuration

### Environment Variables

Edit `values.yaml` to configure:

```yaml
relayer:
  env:
    RPC_URL: "https://your-rpc-endpoint"
    CANON_ADDRESS: "0xYourCanonContract"
    FOUNDATION_ADDRESS: "0xYourFoundation"
```

### Secrets

Set secrets via Helm values or external secret management:

```bash
# Via Helm values
helm upgrade --install null-protocol ./null-protocol \
  --set relayer.secrets.RELAYER_PK="0xabcdef..."

# Via external secrets (recommended)
kubectl create secret generic relayer-secrets \
  --from-literal=RELAYER_PK="0xabcdef..." \
  --from-literal=VENUE_HMAC_KEY="your-hmac-key"
```

### Ingress

Configure ingress for external access:

```yaml
relayer:
  ingress:
    enabled: true
    className: nginx
    hosts:
      - host: relay.yourdomain.com
        path: /
```

## Production Deployment

### 1. Prepare Environment

```bash
# Create namespace
kubectl create namespace null-protocol

# Set up secrets
kubectl create secret generic relayer-secrets \
  --from-literal=RELAYER_PK="$(cat relayer.key)" \
  --from-literal=VENUE_HMAC_KEY="$(openssl rand -hex 32)" \
  --namespace null-protocol
```

### 2. Deploy with Production Values

```bash
helm upgrade --install null-protocol ./null-protocol \
  --namespace null-protocol \
  --values ./null-protocol/values.yaml \
  --set global.imageTag="v1.0.0" \
  --set relayer.replicas=3 \
  --set relayer.resources.limits.cpu="1000m" \
  --set relayer.resources.limits.memory="1Gi"
```

### 3. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n null-protocol

# Test health endpoint
kubectl port-forward svc/relayer 8787:80 -n null-protocol
curl http://localhost:8787/healthz

# Check logs
kubectl logs -l app=relayer -n null-protocol -f
```

## Monitoring

### Prometheus Integration

```yaml
# Add to values.yaml
monitoring:
  enabled: true
  serviceMonitor:
    enabled: true
    interval: 30s
```

### Grafana Dashboard

Import the dashboard from `ops/dashboards/relayer-dashboard.json`

## Scaling

### Horizontal Pod Autoscaler

```yaml
relayer:
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
```

### Vertical Scaling

```yaml
relayer:
  resources:
    requests:
      cpu: "500m"
      memory: "512Mi"
    limits:
      cpu: "2000m"
      memory: "2Gi"
```

## Troubleshooting

### Common Issues

1. **Pods not starting**
   ```bash
   kubectl describe pod <pod-name> -n null-protocol
   kubectl logs <pod-name> -n null-protocol
   ```

2. **Database connection issues**
   ```bash
   kubectl logs -l app=indexer -n null-protocol
   kubectl exec -it <postgres-pod> -n null-protocol -- psql -U null_user -d null_indexer
   ```

3. **Ingress not working**
   ```bash
   kubectl describe ingress relayer-ingress -n null-protocol
   kubectl get ingress -n null-protocol
   ```

### Health Checks

```bash
# Check service health
kubectl get svc -n null-protocol

# Check ingress
kubectl get ingress -n null-protocol

# Check persistent volumes
kubectl get pv,pvc -n null-protocol
```

## Backup & Recovery

### Database Backup

```bash
# Create backup
kubectl exec -it <postgres-pod> -n null-protocol -- \
  pg_dump -U null_user null_indexer > backup.sql

# Restore backup
kubectl exec -i <postgres-pod> -n null-protocol -- \
  psql -U null_user null_indexer < backup.sql
```

### Configuration Backup

```bash
# Backup Helm values
helm get values null-protocol -n null-protocol > values-backup.yaml

# Backup secrets
kubectl get secret relayer-secrets -n null-protocol -o yaml > secrets-backup.yaml
```

## Security

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: null-protocol-netpol
  namespace: null-protocol
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
  egress:
  - to: []
    ports:
    - protocol: TCP
      port: 5432  # PostgreSQL
    - protocol: TCP
      port: 443   # HTTPS
```

### Pod Security Standards

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: null-protocol
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

## Maintenance

### Updates

```bash
# Update to new version
helm upgrade null-protocol ./null-protocol \
  --namespace null-protocol \
  --set global.imageTag="v1.1.0"

# Rollback if needed
helm rollback null-protocol 1 -n null-protocol
```

### Cleanup

```bash
# Uninstall everything
helm uninstall null-protocol -n null-protocol

# Remove namespace (careful!)
kubectl delete namespace null-protocol
```
