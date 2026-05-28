# Provider Abstraction Architecture

## Why Provider Abstraction

Every infrastructure dependency (cache, database, secrets, KMS) MUST be swappable without code changes. This is critical for:

1. **Pivot readiness** — Changing from Redis to KeyDB means changing an env var, not rewriting code
2. **Local development** — Developers run with in-memory cache, production uses Redis cluster
3. **Testing** — Tests use mock providers, not real infrastructure
4. **Graceful degradation** — Fallback to PostgreSQL when Redis is down
5. **Cloud portability** — Move from AWS to GCP without code changes

## Architecture

```
┌────────────────────────────────────┐
│         Application Code           │
│  (routes, services, middleware)    │
│         │         │                │
│         ▼         ▼                │
│  cacheService    dbService         │
│  req.app.locals  req.app.locals    │
│         │         │                │
│         ▼         ▼                │
│       ServiceFactory               │
│  (creates providers based on       │
│   CACHE_PROVIDER env var)          │
│         │         │                │
│         ▼         ▼                │
│  ┌─────────┐  ┌──────────┐        │
│  │ ICache  │  │ IDatabase│        │
│  │ Service │  │ Service  │        │
│  └────┬────┘  └────┬─────┘        │
│       │            │              │
│  ┌────┴────┐  ┌────┴──────┐      │
│  │ Redis   │  │ PostgreSQL│      │
│  │ Valkey  │  │ Cockroach │      │
│  │ KeyDB   │  │ MySQL     │      │
│  │ Memory  │  │ Memory    │      │
│  └─────────┘  └───────────┘      │
└────────────────────────────────────┘
```

## Interface Definitions

### Cache Service (ICacheService Complete Interface)

```javascript
// Backend abstraction — applies to any backend language
class ICacheService {
    // Connection lifecycle
    async connect() {}
    async disconnect() {}
    isReady() {}

    // Session management (verification/auth sessions)
    async setSession(sessionId, data, ttlSeconds) {}
    async getSession(sessionId) {}
    async deleteSession(sessionId) {}
    async sessionExists(sessionId) {}

    // Key-value (TTL IS REQUIRED — GDPR)
    async get(key) {}
    async set(key, value, ttlSeconds) {}  // TTL REQUIRED
    async setEx(key, value, ttlSeconds) {} // Same as set with TTL
    async del(key) {}
    async exists(key) {}
    async ttl(key) {}
    async expire(key, ttlSeconds) {}

    // Bulk operations
    async mGet(keys) {}              // Batch get (MGET)
    async mSet(entries, ttlSeconds) {} // Batch set

    // Counter
    async incr(key, increment = 1) {}

    // Set operations
    async sAdd(setKey, ...members) {}
    async sMembers(setKey) {}
    async sRem(setKey, ...members) {}
    async sCard(setKey) {}

    // List operations
    async lPush(listKey, ...values) {}
    async lRange(listKey, start, stop) {}
    async lTrim(listKey, start, stop) {}

    // Hash operations
    async hSet(hashKey, field, value) {}
    async hGet(hashKey, field) {}
    async hGetAll(hashKey) {}
    async hLen(hashKey) {}

    // Scanning (MUST use SCAN not KEYS — blocks Redis)
    async scan(pattern, count = 100) {}
    async *scanIterator(pattern, count = 100) {}  // Async generator

    // Health check
    async healthCheck() {}
    getProviderName() {}
}
```

### Database Service (IDatabaseService Complete Interface)

```javascript
class IDatabaseService {
    // Connection lifecycle
    async connect() {}
    async disconnect() {}
    isReady() {}

    // Key wrap operations (encrypted key storage)
    async storeWrappedKey(uuid, userAlias, wrappedKey, keyVersion, options) {}
    async getWrappedKey(uuid) {}
    async deleteWrappedKey(uuid) {}
    async hasWrappedKey(uuid) {}

    // Audit operations
    async insertAuditLog(uuid, action, ipAddress, details) {}
    async getAuditLog(uuid, options = {}) {}
    async exportUserData(userId) {}  // GDPR data export

    // Generic query interface
    async query(sql, params) {}
    async transaction(callback) {}

    // Pool management
    getPool() {}
    async getStats() {}

    // Health check
    async healthCheck() {}
    getProviderName() {}
}
```

### Hybrid Cache (Redis + PostgreSQL Fallback)

For production resilience, a HybridCacheService combines Redis for speed with PostgreSQL as a fallback:

```
Request → Redis (fast) → hit? → return
                       → miss? → PostgreSQL fallback → cache in Redis → return
```

The hybrid mode is enabled with `CACHE_PROVIDER=redis-hybrid` and requires both a Redis client and a dbService instance.

## Implementation Pattern

### ServiceFactory (Class with Static Methods)

```javascript
// ServiceFactory.js
const { RedisCacheService } = require('./cache/RedisCacheService');
const { HybridCacheService } = require('./cache/HybridCacheService');
const { MemoryCacheService } = require('./cache/MemoryCacheService');
const { PgDatabaseService } = require('./database/PgDatabaseService');

class ServiceFactory {
    static createCacheService(options = {}) {
        const { redisClient, dbService, logger } = options;
        const provider = process.env.CACHE_PROVIDER || 'redis';

        switch (provider) {
            case 'memory':
                return new MemoryCacheService();
            case 'redis':
                if (!redisClient) throw new Error('Redis client required');
                return new RedisCacheService(redisClient);
            case 'redis-hybrid':
                if (!redisClient) throw new Error('Redis client required');
                return new HybridCacheService(redisClient, {
                    dbService: dbService || null,
                    logger: logger || console,
                    prefix: 'app',
                    fallbackEnabled: process.env.POSTGRES_FALLBACK_ENABLED !== 'false'
                });
            default:
                throw new Error(`Unknown cache provider: ${provider}`);
        }
    }

    static createDatabaseService(databaseModule = null) {
        const provider = process.env.DB_PROVIDER || 'postgresql';
        switch (provider) {
            case 'postgresql':
                if (!databaseModule) throw new Error('Database module required');
                return new PgDatabaseService(databaseModule);
            // Future: mysql, cockroachdb
            default:
                throw new Error(`Unknown DB provider: ${provider}`);
        }
    }
}
```

### Usage in server.js

```javascript
const { ServiceFactory } = require('./services/ServiceFactory');

const cacheService = ServiceFactory.createCacheService({ redisClient });
const dbService = ServiceFactory.createDatabaseService(databaseModule);

app.locals.cacheService = cacheService;
app.locals.dbService = dbService;

// Usage in any route — NO direct Redis/DB calls:
router.post('/data', async (req, res) => {
    const cache = req.app.locals.cacheService;
    const data = await cache.get(`key:${id}`);
});
```

### Service Classes (Constructor Injection)

All services use constructor injection for dependencies:

```javascript
class MyService {
    constructor(pool) {
        this.db = pool;           // Database pool (not private pool)
    }

    async getData(uuid) {
        const result = await this.db.query(
            'SELECT * FROM table WHERE uuid = $1', [uuid]
        );
        return result.rows[0];
    }
}

// Factory function for shared instances:
let _instance = null;
function getMyService(dbPool) {
    if (!_instance && dbPool) {
        _instance = new MyService(dbPool);
    }
    return _instance;
}
```

## Environment Variables

```bash
CACHE_PROVIDER=redis            # redis | redis-hybrid | memory
DB_PROVIDER=postgresql          # postgresql
POSTGRES_FALLBACK_ENABLED=true  # Fallback when cache is down
FALLBACK_RETRY_ATTEMPTS=3       # Retries before fallback
IP_ANONYMIZATION_OCTETS=3       # GDPR IP anonymization level
ENROLLMENT_RETENTION_DAYS=1     # Factor digest TTL
```

## Rules

1. **NEVER call Redis/DB directly** — Always through cacheService/dbService
2. **NEVER create private DB pools** — Use the shared pool from ServiceFactory
3. **NEVER use `new Map()` for sessions** — Not shared across instances
4. **NEVER call `.set()` without TTL** — GDPR violation
5. **ALWAYS use SCAN not KEYS** — KEYS blocks Redis on large datasets
6. **ALWAYS batch operations** — Use mGet/mSet instead of N individual calls
7. **ALWAYS inject dependencies via constructor** — No module-level singletons

## Testing with Abstractions

```javascript
const mockCache = {
    get: async (key) => testData[key],
    set: async (key, value, ttl) => { testData[key] = value; },
    del: async (key) => { delete testData[key]; },
    exists: async (key) => key in testData,
    incr: async (key) => { testData[key] = (testData[key] || 0) + 1; return testData[key]; }
};
```
