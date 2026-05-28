# Testing Strategy

## The Rule: Tests Always, Every Change

**Every code change MUST include or update tests.** This is not negotiable. No exceptions. Not "we'll add tests later." Not "it's just a small change." Not "it's just a config file." Every change modifies behavior — every change needs a test.

```
Code change → Risk assessment → Approval (security + architecture + compliance)
                                    ↓
                           Write/update tests FIRST
                                    ↓
                           Write/update implementation
                                    ↓
                           Run tests: pass? ✅
                           Run tests: fail? ❌ Fix until pass
                                    ↓
                           Pentest handoff (automated)
```

## Why This Matters (For Junior Founders)

You're building something new. You don't have users yet to tell you when something breaks. The only thing between your code and a production incident is your test suite. Here's what happens without tests:

| Without Tests | With Tests |
|---------------|------------|
| You deploy → "it doesn't work" → scramble to debug | You deploy → tests pass → confident |
| You refactor → "oh no, the old thing broke" → no idea what you broke | You refactor → tests tell you exactly what broke |
| You hire → new dev breaks something → blame game | You hire → new dev runs tests → safe |
| Auditor asks "how do you know it works?" → "we tested manually" 🤷 | Auditor asks → "140 tests, all passing, here's the coverage report" ✅ |

**Tests are not a cost. Tests are speed.** Every minute writing a test saves 10 minutes of debugging later. Every test you skip adds 30 minutes of "why is this broken?" at 2 AM.

## Flow: Risk Assessment → Approval → Code

### Step 1: Risk Assessment (Before ANY Code)

Before writing a single line, create a risk assessment for the change:

```javascript
// For every change, answer:
// 1. What does this change? (describe the behavior modification)
// 2. What could go wrong? (list failure modes)
// 3. What data is affected? (new fields, existing fields, data flow)
// 4. What security boundaries does it cross? (auth, encryption, storage)
// 5. What compliance requirements apply? (GDPR, PSD3, etc.)
```

**Read `11-CHECKLISTS/06-governance-records.md` for the full risk assessment template.**

### Step 2: Approval (Security + Architecture + Compliance)

All three must approve the risk assessment before code is written:

| Role | Approves | Must Sign Off On |
|------|----------|-----------------|
| Security | Threat model, attack vectors, data protection | No new vulnerabilities introduced |
| Architecture | Design fits the system, no tech debt | Pattern consistency, no architectural violations |
| Compliance | Regulatory requirements met | GDPR, PSD3, PCI-DSS, BIPA requirements satisfied |

**If any one of them rejects, the change does not proceed.** No "we'll fix security later." Security by design means security is the architecture, not a review step.

### Step 3: Write Tests FIRST

Before implementation, write tests that define the expected behavior:

```javascript
// 1. Write test that describes what the code SHOULD do
describe('AccountLockService', () => {
    it('should lock account after 5 failed attempts', async () => {
        const service = new AccountLockService(cacheService);
        for (let i = 0; i < 5; i++) {
            await service.recordFailedAttempt('user-123');
        }
        const isLocked = await service.isLocked('user-123');
        expect(isLocked).to.be.true;
    });

    it('should unlock after cooldown period', async () => {
        // ... test cooldown logic
    });

    it('should reset attempts on successful login', async () => {
        // ... test reset behavior
    });
});

// 2. Run tests (they should fail — no implementation yet)
// 3. Write implementation
// 4. Run tests (they should pass)
// 5. Run ALL existing tests (nothing broke)
```

### Step 4: Implement

Write the code that makes the tests pass. Nothing more.

### Step 5: Run Everything

```bash
npm test                    # All tests pass? ✅
npm run test:services       # Service-layer tests pass? ✅
npm run test:integration    # Integration tests pass? ✅
```

### Step 6: Pentest Handoff (Automated)

After implementation passes all tests, a pentesting agent automatically attempts to break the code. See `04-SECURITY/09-pentesting-agent.md`.

---

## Zero-Dependency Local Testing

The single biggest productivity boost: **make `npm test` / `./gradlew test` work without any external infrastructure.**

### The Pattern: Mock Adapters Drop-In

```bash
# This should work with zero dependencies:
npm test          # ~2 seconds, no Redis, no DB, no Docker
```

Key insight: design your cache/DB layer with an interface, then inject an in-memory adapter when `MOCK_REDIS=true` or `CACHE_PROVIDER=memory`:

```
npm test
  ├─ 1. dotenv loads .env.test
  │      → MOCK_REDIS=true
  │      → DATABASE_ENABLED=false
  │      → RATE_LIMIT_DISABLED=true
  │
  ├─ 2. Test runner detects MOCK_REDIS=true
  │      → injects MemoryCacheClient (Map-based, TTL-aware)
  │      → instead of real Redis client
  │
  ├─ 3. All 140+ unit tests run against in-memory adapter
  │      → same API, same behavior, no infrastructure
  │
  └─ 4. Results: 140 passing, ~2 seconds
```

### Provider Abstraction (ICacheService)

```javascript
class ICacheService {
  async connect()     { throw new Error('Not implemented'); }
  async disconnect()  { throw new Error('Not implemented'); }
  async set(key, val, ttlSeconds) { throw new Error('Not implemented'); }
  async get(key)      { throw new Error('Not implemented'); }
  async del(key)      { throw new Error('Not implemented'); }
  async hSet(key, field, val) { throw new Error('Not implemented'); }
  async hGet(key, field)      { throw new Error('Not implemented'); }
  async hGetAll(key)          { throw new Error('Not implemented'); }
  async scan(pattern)         { throw new Error('Not implemented'); }
}

// In-memory for test
class MemoryCacheService extends ICacheService {
  constructor() {
    this._store = new Map();
    this._ttls = new Map();  // key → expiry timestamp
  }
  async connect() { this._ready = true; }
  async set(key, val, ttlSeconds) {
    this._store.set(key, val);
    if (ttlSeconds > 0) this._ttls.set(key, Date.now() + ttlSeconds * 1000);
  }
  async get(key) {
    this._expireStale(key);
    return this._store.get(key) || null;
  }
  _expireStale(key) {
    const expiry = this._ttls.get(key);
    if (expiry && Date.now() > expiry) { this._store.delete(key); this._ttls.delete(key); }
  }
}

// Redis (production)
class RedisCacheService extends ICacheService {
  constructor(redisClient) { this.redis = redisClient; }
  async set(key, val, ttlSeconds) { await this.redis.setEx(key, ttlSeconds, val); }
  async get(key) { return this.redis.get(key); }
}
```

### ServiceFactory: Provider Switching via Environment

```javascript
class ServiceFactory {
  static createCacheService({ redisClient, dbService, logger }) {
    const provider = process.env.CACHE_PROVIDER || 'redis';
    switch (provider) {
      case 'redis':        return new RedisCacheService(redisClient);
      case 'redis-hybrid': return new HybridCacheService(redisClient, { dbService, fallbackEnabled: true });
      case 'memory':       return new MemoryCacheService();
      default:             throw new Error(`Unknown cache provider: ${provider}`);
    }
  }
}
```

### Test Tiers

```
          ┌──────────┐
          │   E2E    │  ← Full system: running server + DB + Redis
          └──────────┘     ⏱ 30-60s
        ┌──────────────┐
        │  Integration  │  ← Mocked services, real route wiring
        └──────────────┘     ⏱ 10-15s
      ┌──────────────────┐
      │     Service      │  ← Mocked cache/DB adapters
      └──────────────────┘     ⏱ 5-10s
    ┌──────────────────────┐
    │      Unit Tests      │  ← Pure functions, zero dependencies
    └──────────────────────┘     ⏱ 1-3s
```

| Tier | Tool | Speed | Deps | Run Command |
|------|------|-------|------|-------------|
| Unit | Mocha + Chai | ~2s | None | `npm test` |
| Service | Mocha + Chai | ~15s | Mock adapter | `npm run test:services` |
| Integration | Mocha + Supertest | ~15s | Mock adapter | `npm run test:integration` |
| E2E | Mocha + Supertest | ~30s | Running server | `npm run test:e2e` |

### Environment Isolation

```bash
# .env.test — loaded by `npm test` via DOTENV_CONFIG_PATH
MOCK_REDIS=true             # Use in-memory adapter
DATABASE_ENABLED=false      # Skip DB connection
RATE_LIMIT_DISABLED=true    # Prevent 429 in tests
LOG_LEVEL=error             # Reduce noise
NODE_ENV=test               # Disable Redis reconnect strategy
```

```javascript
// tests/setup.js — Mocha root hook plugin
process.env.MOCK_REDIS = process.env.MOCK_REDIS || 'true';
process.env.RATE_LIMIT_DISABLED = process.env.RATE_LIMIT_DISABLED || 'true';
```

```json
// .mocharc.json — default test config
{
  "spec": ["tests/unit/**/*.test.js", "tests/seal-integration.test.js"],
  "recursive": true,
  "timeout": 10000,
  "require": ["tests/setup.js"],
  "exit": true
}
```

### What To Test (Per Change Type)

| Change Type | Must Test |
|-------------|-----------|
| New endpoint | Happy path + all error codes + rate limiting + auth |
| New service | Each public method + edge cases + error states |
| Bug fix | The bug (repro) + the fix + regression (did anything break?) |
| Config change | That config is read correctly + default fallback |
| Security fix | The vulnerability (proof it existed) + the fix (proof it's gone) + all related paths |
| Refactor | All existing behavior still works (run ALL tests) |
| Dependency update | Core behavior unchanged + no new vulnerabilities |

### Test-Driven Bug Fix Flow

```javascript
// 1. Write a test that REPRODUCES the bug (it fails)
it('should not allow PIN 1234 (bug REPRO)', async () => {
    const result = await authService.verifyPin('user-123', '1234');
    expect(result).to.equal('WEAK_PIN_REJECTED');  // Expected behavior
    // ❌ Currently returns 'PIN_VERIFIED' — this test fails = bug confirmed
});

// 2. Fix the code
// 3. Test passes = bug is fixed
// 4. Run ALL other tests = nothing else broke
// 5. Commit the test + fix together
```

## Pre-Push Testing Gate

```bash
#!/usr/bin/env bash
# scripts/pre-push-test.sh
# BLOCKS push if tests fail

echo "🔍 Running test suite..."

if ! npm test; then
    echo "❌ BLOCKED: Tests failed. Fix before pushing."
    exit 1
fi

# Check test coverage (optional, warn only)
COVERAGE=$(npm test -- --coverage 2>/dev/null | grep "Lines" | awk '{print $3}')
if [ -n "$COVERAGE" ] && [ "${COVERAGE%%.*}" -lt 70 ]; then
    echo "⚠️  WARNING: Line coverage is ${COVERAGE}% (minimum 70%)"
fi

echo "✅ All tests passing."
exit 0
```

## Key Lesson

> **If your test suite requires infrastructure to run, developers won't run it.** Make `npm test` work with zero dependencies in <3 seconds. Everything else is optional gates that run in CI.

The mock adapter pattern (interface → production impl + test impl) pays for itself on day one. Every team member can run the full suite before committing, no Docker required.

## Checklist (Every Change)

- [ ] Risk assessment completed BEFORE writing code
- [ ] Security + architecture + compliance approved the risk assessment
- [ ] Tests written/updated for this change (not "existing tests should cover it")
- [ ] Bug fix: repro test written first (test fails → fix → test passes)
- [ ] All existing tests still pass (no regressions)
- [ ] `npm test` runs in <3s with zero deps
- [ ] Pentest handoff triggered (automated)
