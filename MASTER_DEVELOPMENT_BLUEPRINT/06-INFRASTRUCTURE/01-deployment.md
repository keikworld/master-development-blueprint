# Deployment

## Deployment Model

```
Dev ─── Staging ─── Production
       (CI/CD)      (Manual approval)
```

### Layers

| Layer | Technology | Scaling |
|-------|-----------|---------|
| **Frontend** | CDN + Static hosting | Edge (multi-region) |
| **Backend** | Containerized (Docker) | Horizontal (100s of instances) |
| **Database** | Managed PostgreSQL | Read replicas (10s) |
| **Cache** | Managed Valkey/Redis | Cluster mode |
| **Queue** | RabbitMQ | Clustered |
| **Storage** | S3-compatible | Automatic |

---

## Docker Configuration

```dockerfile
FROM node:20-slim

WORKDIR /app

# 1. Install dependencies (separate step for layer caching)
COPY package*.json ./
RUN npm ci --only=production

# 2. Copy source
COPY . .

# 3. Non-root user
USER node

# 4. Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD node healthcheck.js

# 5. Start
EXPOSE 3000
CMD ["node", "server.js"]
```

### Docker Compose (Development)

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - REDIS_HOST=redis
      - DATABASE_URL=postgresql://user:pass@db:5432/app
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: valkey/valkey:8-alpine
    ports:
      - "6379:6379"
```

---

## Environment Strategy

| Environment | Source | Auto-deploy | Data |
|-------------|--------|-------------|------|
| **Development** | Feature branch | No | Mock/test data |
| **Staging** | Master | Yes (on push) | Anonymized prod data |
| **Production** | Tagged release | Manual approval | Real data |

### Configuration per Environment

```javascript
// config/env.js
const configs = {
    development: {
        logLevel: 'debug',
        rateLimit: { window: 60, max: 500 },
        cors: { origin: '*' }
    },
    staging: {
        logLevel: 'info',
        rateLimit: { window: 60, max: 300 },
        cors: { origin: 'https://staging.example.com' }
    },
    production: {
        logLevel: 'warn',
        rateLimit: { window: 60, max: 200 },
        cors: { origin: 'https://example.com' },
        strictNonce: true,
        sentryDsn: process.env.SENTRY_DSN
    }
};
```

---

## Health Check & Readiness

```javascript
// healthcheck.js
const endpoints = [
    '/health',    // Server alive
    '/ping',      // DB connection
    '/v1/supported' // API alive
];

// Readiness probe: all dependencies reachable
// Liveness probe: server responds
```

---

## Zero-Downtime Deployment

1. **Rolling update** — Replace containers one at a time
2. **Blue/green** — New version alongside old, switch traffic
3. **Canary** — Route 10% traffic to new version, monitor, full rollout

---

## Monitoring & Alerting

### Metrics to Monitor

| Category | Metric | Alert Threshold |
|----------|--------|-----------------|
| **Error rate** | 5xx responses | >1% over 5 min |
| **Latency** | p95 response time | >500ms over 5 min |
| **Auth** | Failed logins per minute | >20/min |
| **Auth** | Rate limit hits | >100/min |
| **Rate limit** | Crypto operations | >1000/min |
| **Database** | Connection pool usage | >80% |
| **Infrastructure** | CPU/Memory | >85% |

### Log Aggregation

```javascript
// Structured logging for machine parsing
logger.info('Auth attempt', {
    userId: slicedId,     // PII-safe (last 8 chars)
    method: 'jwt',
    result: 'success',
    durationMs: 45,
    ipPrefix: anonymizeIP(req.ip)  // Anonymized
});
```

---

## Disaster Recovery

| Scenario | RTO | RPO | Recovery Method |
|----------|-----|-----|-----------------|
| Single instance failure | <1 min | 0 | Auto-restart/health check |
| Full region failure | <15 min | <1 min | Multi-region deployment |
| Data corruption | <4 hours | <5 min | Point-in-time recovery |
| Security breach | <1 hour | 0 | Revoke keys, rollback deployment |

### Backup Strategy

| Data | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Database | Hourly | 7 days | S3 |
| Database | Daily | 30 days | S3 (cross-region) |
| Config | Per change | 90 days | Git history |
| Secrets | Per rotation | 1 year | KMS/HSM |
| Audit logs | Real-time | 90 days | S3 (immutable bucket) |
