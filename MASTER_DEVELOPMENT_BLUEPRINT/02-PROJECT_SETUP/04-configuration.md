# Configuration

## Environment Variable Management

### File Hierarchy

```
.env.example         # Committed to git — template with comments, no secrets
.env.local           # Local overrides (gitignored)
.env.test            # Test environment (committed)
.env.production      # Production secrets (gitignored, deployed via secret manager)
.env.staging         # Staging (gitignored)
```

### .env.example Best Practices

```bash
# =============================================================================
# Server Configuration
# =============================================================================
PORT=3000                           # API server port
NODE_ENV=development                # development | test | production
LOG_LEVEL=debug                     # debug | info | warn | error

# =============================================================================
# Database (PostgreSQL)
# =============================================================================
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
DB_POOL_MIN=2                       # Minimum connection pool size
DB_POOL_MAX=10                      # Maximum connection pool size
POSTGRES_FALLBACK_ENABLED=true      # Fallback to PG when cache is down

# =============================================================================
# Cache (Valkey / Redis)
# =============================================================================
CACHE_PROVIDER=redis                # redis | memory | hybrid
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                     # Empty for no auth

# =============================================================================
# Authentication
# =============================================================================
JWT_SECRET=                         # Generate: openssl rand -base64 32
JWT_EXPIRY=900                      # 15 minutes (in seconds)
REFRESH_TOKEN_EXPIRY=604800         # 7 days

# =============================================================================
# Encryption
# =============================================================================
ENCRYPTION_KEY=                     # Generate: openssl rand -base64 32
PRIVACY_APP_SALT=                   # Generate: openssl rand -base64 32
KMS_KEY_ID=                         # AWS KMS key ID (optional, for production)

# =============================================================================
# Security
# =============================================================================
RATE_LIMIT_WINDOW_MS=60000          # 1 minute window
RATE_LIMIT_MAX_REQUESTS=100         # Max requests per window
SESSION_TTL=900                     # 15 minutes (Redis session TTL)
NONCE_TTL=300                       # 5 minutes (replay protection)
ADMIN_API_KEY=                      # Generate: openssl rand -hex 32

# =============================================================================
# Compliance
# =============================================================================
AUDIT_LOG_RETENTION_DAYS=90         # GDPR audit log retention
DEVICE_ID_RETENTION_DAYS=365        # Device ID retention
IP_ADDRESS_RETENTION_DAYS=30        # IP prefix retention
MINIMUM_FACTORS_ENROLLMENT=3        # Minimum auth factors required
BIPA_ENABLED=false                  # Biometric consent (Illinois)
```

### Rules

1. **All new vars go to ALL env files** — `.env.example`, `.env.test`, CI workflows
2. **Every var has a comment** — Purpose, example value, security notes
3. **Secrets start EMPTY** — No placeholder secrets (e.g., `PASSWORD=changeme` is bad)
4. **Defaults are safe** — Disabled by default for new features
5. **Env var sync checked by pre-push agent** — Missing vars block pushes

---

## Secret Management

### Architecture

```
┌────────────────────────────────────────────────┐
│                  Application                   │
│                                                │
│  config/secrets.js  ←  Central access point    │
│       ↓                                        │
│  process.env  ←  Loaded from .env files        │
│       ↓                                        │
│  Secrets Manager  ←  Production secrets        │
│  (AWS Secrets Manager / HashiCorp Vault)        │
└────────────────────────────────────────────────┘
```

### Secret Access Pattern (JavaScript)

```javascript
// ✅ CORRECT — Centralized secret access
const { getJwtSecret } = require('../config/secrets');
const jwtSecret = getJwtSecret();  // Not process.env.JWT_SECRET

// ❌ WRONG — Direct process.env access (bypasses validation)
const jwtSecret = process.env.JWT_SECRET;
```

```kotlin
// ✅ CORRECT — Centralized configuration object
object AppConfig {
    val jwtSecret: String = System.getenv("JWT_SECRET") 
        ?: error("JWT_SECRET not configured")
}
```

### Secret Generation

```bash
# 256-bit secrets
openssl rand -base64 32    # Encryption keys, JWT secrets
openssl rand -hex 32       # API keys, HMAC secrets

# Passwords (memorable)
openssl rand -base64 16    # Database passwords
```

### Buffer Handling (Memory Wipe)

```javascript
const crypto = require('crypto');

function processWithSecret(secret) {
    const buf = Buffer.from(secret, 'utf-8');
    try {
        // Use the secret
        const hash = crypto.createHmac('sha256', buf).update(data).digest();
        return hash;
    } finally {
        // ALWAYS wipe after use
        buf.fill(0);
    }
}
```

---

## Feature Flag System

### Pattern

Feature flags are env vars, not database rows (for simplicity):

```bash
# .env.example
NEW_PAYMENT_FLOW_ENABLED=false    # Master toggle
BIOMETRIC_AUTH_ENABLED=true        # Feature flag
CRYPTO_PAYMENTS_ENABLED=false      # Experimental
```

### Code Pattern

```javascript
const isFeatureEnabled = (flagName) => {
    return process.env[flagName] === 'true';
};

// Usage
if (isFeatureEnabled('CRYPTO_PAYMENTS_ENABLED')) {
    // New payment flow
}
```

### Lifecycle

1. **Add** flag (disabled by default, document in .env.example)
2. **Test** with flag off (old path) and on (new path)
3. **Enable** for staging, then production (gradual rollout)
4. **Monitor** for regressions
5. **Remove** flag and old code path once stable
6. **Update** .env.example to remove the flag

---

## Environment-Specific Configuration

| Environment | Purpose | Env File | Database | Secrets |
|-------------|---------|----------|----------|---------|
| **development** | Local dev | `.env.local` (gitignored) | Local PostgreSQL | Local KMS |
| **test** | CI/Automated tests | `.env.test` (committed) | Test DB (auto-created) | Test secrets (committed) |
| **staging** | Pre-production | `.env.staging` | Staging DB | Staging secrets |
| **production** | Live | `.env.production` | Production DB | Secrets Manager |

### Startup Validation

Run at server boot (after dotenv/logger init). Validates configuration invariants. Non-blocking — logs structured warnings for ops dashboards.

```javascript
// backend/utils/startupValidator.js
const logger = require('./logger');

const REQUIRED_ENV = {
    security: ['PRIVACY_APP_SALT', 'ADMIN_API_KEY'],
    database: ['DATABASE_URL'],
    encryption: ['ENCRYPTION_MASTER_KEY']
};
const RECOMMENDED_ENV = [
    'KMS_KEY_ID', 'REDIS_PASSWORD', 'JWT_SECRET',
    'WEBHOOK_SIGNING_KEY', 'AGENT_API_KEY_ENCRYPTION_KEY'
];

function validateStartup() {
    const counts = { warnings: 0, errors: 0 };
    // 1. Check required env vars (grouped by subsystem)
    for (const [group, vars] of Object.entries(REQUIRED_ENV))
        for (const v of vars)
            if (!process.env[v]) {
                logger.error(`[startup] MISSING REQUIRED: ${v} (${group})`);
                counts.errors++;
            }
    // 2. Recommended env vars
    for (const v of RECOMMENDED_ENV)
        if (!process.env[v]) {
            logger.warn(`[startup] MISSING RECOMMENDED: ${v}`);
            counts.warnings++;
        }
    // 3. PRIVACY_APP_SALT strength
    const salt = process.env.PRIVACY_APP_SALT;
    if (salt?.includes('WARNING_INSECURE')) {
        logger.error('[startup] PRIVACY_APP_SALT uses insecure default');
        counts.errors++;
    } else if (salt && salt.length < 16) {
        logger.warn('[startup] PRIVACY_APP_SALT too short (< 16 chars)');
        counts.warnings++;
    }
    // 4. Production checks
    if (process.env.NODE_ENV === 'production') {
        if (process.env.REDIS_TLS_ENABLED !== 'true') {
            logger.warn('[startup] REDIS_TLS_ENABLED not true — unencrypted traffic');
            counts.warnings++;
        }
        if (process.env.MOCK_REDIS === 'true') {
            logger.error('[startup] MOCK_REDIS=true in production — data not persisted!');
            counts.errors++;
        }
    }
    return counts;
}
```
