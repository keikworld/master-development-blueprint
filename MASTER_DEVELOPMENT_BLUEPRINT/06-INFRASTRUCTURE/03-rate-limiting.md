# Rate Limiting (3-Tier Escalation)

## The Pattern

Instead of a single "5 attempts per hour" threshold, use **escalating cooldowns** that get progressively harsher. This stops automated attacks while forgiving genuine mistakes.

```
Tier 1: 5 failed attempts  → 15 minute cooldown  (retry_after: 900)
Tier 2: 8 failed attempts  → 4 hour cooldown      (retry_after: 14400)
Tier 3: 10 failed attempts → Frozen (manual reset) (retry_after: ∞)
```

Each tier tracks a **sliding window** (not a fixed clock), so a burst at 11:59 PM doesn't penalize you at 12:00 AM.

---

## Implementation

### The Backend (Node.js)

```javascript
class RateLimiter {
    constructor(redisClient) {
        this.redis = redisClient;

        // Escalating tiers — each threshold increases cooldown
        this.tiers = [
            { threshold: 5,  cooldownMs: 15 * 60 * 1000 },     // 15 min
            { threshold: 8,  cooldownMs: 4 * 60 * 60 * 1000 },  // 4 hours
            { threshold: 10, cooldownMs: Infinity },              // Frozen
        ];
    }

    async check(key) {
        const lockKey = `lockout:${key}`;

        // Check current cooldown tier first (fast path)
        const record = await this.redis.get(lockKey);
        if (record) {
            const parsed = JSON.parse(record);
            const remaining = parsed.expiresAt - Date.now();
            if (remaining > 0) {
                return { allowed: false, retryAfter: Math.ceil(remaining / 1000) };
            }
        }

        // Sliding window: count attempts in last N seconds
        const windowKey = `attempts:${key}`;
        const count = await this.redis.incr(windowKey);

        if (count === 1) {
            // First attempt — set window expiry
            await this.redis.expire(windowKey, SLIDING_WINDOW_SEC);
        }

        // Check which tier this count falls into
        const tier = this.tiers.find(t => count >= t.threshold);
        if (tier && tier.cooldownMs !== Infinity) {
            // Escalate: write cooldown record
            const cooldown = {
                count,
                tier: this.tiers.indexOf(tier) + 1,
                expiresAt: Date.now() + tier.cooldownMs,
                escalatedAt: Date.now(),
            };
            await this.redis.set(lockKey, JSON.stringify(cooldown), 'PX', tier.cooldownMs);
            return { allowed: false, retryAfter: Math.ceil(tier.cooldownMs / 1000), tier: cooldown.tier };
        }

        if (tier && tier.cooldownMs === Infinity) {
            // Frozen — requires manual reset
            return { allowed: false, retryAfter: Infinity, tier: 3, frozen: true };
        }

        return { allowed: true, remaining: this.tiers[0].threshold - count };
    }
}
```

### The Multi-Platform SDK (Kotlin)

```kotlin
class RateLimiter(
    private val storage: RateLimitStorage,   // Platform abstraction
    private val slidingWindow: Duration = 30.seconds
) {
    private data class Tier(
        val maxAttempts: Int,
        val cooldown: Duration
    )

    private val tiers = listOf(
        Tier(maxAttempts = 5,  cooldown = 15.minutes),
        Tier(maxAttempts = 8,  cooldown = 4.hours),
        Tier(maxAttempts = 10, cooldown = Duration.INFINITE) // Frozen
    )

    suspend fun attempt(key: String): RateLimitResult {
        // 1. Check if currently in cooldown
        val lockout = storage.get<LockoutRecord>(lockKey(key))
        if (lockout != null && lockout.isActive()) {
            return RateLimitResult.Blocked(
                retryAfter = lockout.remainingMillis(),
                tier = lockout.tier
            )
        }

        // 2. Increment sliding window counter
        val count = storage.increment(windowKey(key), slidingWindow)

        // 3. Check tiers
        val activeTier = tiers.firstOrNull { count >= it.maxAttempts }
            ?: return RateLimitResult.Allowed(remaining = tiers.first().maxAttempts - count)

        // 4. Apply cooldown
        storage.set(
            lockKey(key),
            LockoutRecord(tier = tiers.indexOf(activeTier) + 1, count = count),
            activeTier.cooldown
        )

        return when {
            activeTier.cooldown.isFinite() ->
                RateLimitResult.Blocked(retryAfter = activeTier.cooldown, tier = tiers.indexOf(activeTier) + 1)
            else ->
                RateLimitResult.Frozen
        }
    }

    // Reset on success (successful auth resets the counter)
    suspend fun success(key: String) {
        storage.delete(lockKey(key))
        storage.delete(windowKey(key))
    }

    private fun lockKey(key: String) = "rate_limit:lockout:$key"
    private fun windowKey(key: String) = "rate_limit:attempts:$key"
}
```

## Rate Limit Types

### 1. Sliding Window (Per-IP) — Public endpoints

```javascript
const windowMs = 60 * 1000;       // 60 seconds
const maxRequests = 100;           // Per-IP

// Key: ratelimit:{ip}:{window-start}
// Data: { count, windowStart }
```

### 2. Per-User (Authenticated) — Trusted users

```javascript
const maxRequests = 200;           // Per authenticated user
// Key: ratelimit:user:{uuid}:{window-start}
// Reset on successful auth
```

### 3. Per-Endpoint (Critical) — Auth endpoints get 3-tier escalation

```javascript
const endpointLimits = {
    '/v1/auth/login':         { type: 'escalating' },  // Uses 3-tier pattern above
    '/v1/enrollment':         { type: 'escalating' },
    '/v1/verification':       { type: 'escalating', window: 60, max: 10 },
    '/v1/password/reset':     { type: 'escalating' },
    '/v1/public/health':      { type: 'sliding', window: 60, max: 1000 },  // Generous
    '/v1/public/supported':   { type: 'sliding', window: 60, max: 500 },
};
```

### 4. Global (Emergency Brake) — Kill switch

```javascript
// Redis key: ratelimit:global
const globalLimit = 10000;   // Requests per second across all instances

// Check before per-key check:
const globalCount = await redis.incr('ratelimit:global');
if (globalCount > globalLimit) return { allowed: false, retryAfter: 5 };
```

## Reset on Success

Critical: rate limit counters MUST reset when authentication succeeds. This prevents:

```
❌ User mistypes PIN → counter goes to 5 → waits 15 min
   → User types PIN correctly → counter is still 5 (now locked out for real mistake)
✅ User mistypes PIN → counter goes to 5 → waits 15 min
   → User types PIN correctly → counter resets to 0
```

```javascript
async recordSuccess(key) {
    await Promise.all([
        this.redis.del(`lockout:${key}`),           // Clear cooldown
        this.redis.del(`attempts:${key}`),          // Clear attempt counter
        this.redis.del(`locked:${key}`),            // Clear frozen flag (if any)
    ]);
}
```

## Response Format

```javascript
// 429 Too Many Requests
{
    "success": false,
    "error": {
        "code": "RATE_LIMIT_EXCEEDED",
        "message": "Too many attempts. Try again in 900 seconds.",
        "retryAfter": 900,          // Seconds (Infinity for frozen)
        "tier": 1,                   // Which tier triggered (1-3)
        "frozen": false              // True = manual reset required
    }
}

// Headers
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1716800090
Retry-After: 900
```

## Middleware Wiring

```javascript
// Apply escalating limiter to auth endpoints
router.post('/v1/auth/login',
    rateLimitMiddleware('escalating', { key: req => req.ip }),
    loginHandler
);

// Apply standard sliding window to public endpoints
router.get('/v1/public/health',
    rateLimitMiddleware('sliding', { window: 60, max: 500 }),
    healthHandler
);
```

## Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Single threshold that blocks forever | Escalating tiers — first mistake gets 15 min, not permanent ban |
| Fixed window (resets at midnight) | Sliding window — 5 attempts in rolling 30s window, not calendar reset |
| No success reset | `recordSuccess()` clears attempt counter |
| Frozen users stay frozen forever | Admin API to defrost + expiry check (auto-defrost after 30 days) |
| Rate limiter as first check (before auth) | Check rate limit FIRST, then authenticate (prevents DoS on auth) |
| Different keys share the same counter | Each endpoint/user combination gets its own key |
| Rate limit key includes UUID before UUID exists | Key by IP first, upgrade to UUID after auth |

## Checklist

- [ ] All auth/critical endpoints use 3-tier escalating pattern
- [ ] Sliding window (not fixed clock)
- [ ] Success resets the counter
- [ ] Frozen accounts have auto-defrost or admin defrost endpoint
- [ ] Global emergency brake per instance
- [ ] `Retry-After` header on every 429 response
- [ ] Rate limit is checked BEFORE authentication (prevents auth DoS)
- [ ] Rate limit tests for each tier boundary
