# Retry Pattern (Exponential Backoff + Circuit Breaker)

## Why

Networks fail. Databases timeout. Services crash. A retry with backoff is the difference between a 5-second blip and a 5-minute outage. But naive retries (retry immediately, infinite retries, no jitter) make things worse.

## The 3-Layer Retry Stack

```
Layer 1: Transient Error Retry (Exponential Backoff + Jitter)
  → Network timeouts, 503 Service Unavailable, connection resets
  → Retries with increasing delay + random jitter
  → Max 3 retries, then give up and report error

Layer 2: Circuit Breaker (Repeat Failure Protection)
  → If service fails N times in M seconds → OPEN circuit (fast-fail)
  → After cooldown → HALF-OPEN (try one request)
  → If that succeeds → CLOSED (normal operation)
  → If that fails → OPEN again (longer cooldown)

Layer 3: Idempotency (Safe Retries)
  → Every operation has an idempotency key
  → Server deduplicates: same key + same payload = same result
  → Retries never cause double-charges or duplicate records
```

## Implementation

### Layer 1: Exponential Backoff with Jitter

```javascript
class RetryPolicy {
    constructor(options = {}) {
        this.maxRetries = options.maxRetries ?? 3;
        this.baseDelayMs = options.baseDelayMs ?? 200;   // Start at 200ms
        this.maxDelayMs = options.maxDelayMs ?? 10000;    // Cap at 10s
        this.timeoutMs = options.timeoutMs ?? 5000;       // Per-attempt timeout
        this.jitter = options.jitter ?? 0.1;              // 10% jitter
    }

    async execute(fn, context = {}) {
        let lastError;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                // Add timeout to each attempt
                const result = await withTimeout(fn(), this.timeoutMs);
                return result;

            } catch (err) {
                lastError = err;

                // Don't retry non-retryable errors
                if (!this.isRetryable(err)) {
                    throw err;
                }

                // Last attempt failed — don't sleep, just throw
                if (attempt === this.maxRetries) {
                    break;
                }

                // Calculate backoff: base * 2^attempt + jitter
                const delay = this.calculateDelay(attempt);
                await sleep(delay);
            }
        }

        throw new RetryExhaustedError(lastError, this.maxRetries);
    }

    calculateDelay(attempt) {
        // Exponential: 200ms → 400ms → 800ms
        const exponential = this.baseDelayMs * Math.pow(2, attempt);

        // Cap at max delay
        const capped = Math.min(exponential, this.maxDelayMs);

        // Add random jitter: ±10%
        const jitterAmount = capped * this.jitter;
        const jittered = capped + (Math.random() * jitterAmount * 2 - jitterAmount);

        return Math.round(jittered);
    }

    isRetryable(err) {
        // Network errors: retry
        if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') return true;
        if (err.code === 'ECONNREFUSED' || err.code === 'EAI_AGAIN') return true;

        // HTTP 503, 429: retry (service busy)
        if (err.statusCode === 503 || err.statusCode === 429) return true;

        // HTTP 5xx (but not 503): maybe retry
        if (err.statusCode >= 500 && err.statusCode < 600) return true;

        // Everything else: don't retry (4xx, parse errors, etc.)
        return false;
    }
}
```

```kotlin
// Kotlin (KMP) equivalent
class RetryPolicy(
    private val maxRetries: Int = 3,
    private val baseDelayMs: Long = 200,
    private val maxDelayMs: Long = 10000,
    private val jitter: Double = 0.1
) {
    suspend fun <T> execute(
        fn: suspend () -> T,
        isRetryable: (Throwable) -> Boolean = { true }
    ): T {
        var lastError: Throwable? = null

        for (attempt in 0..maxRetries) {
            try {
                return withTimeout(timeoutMs) { fn() }
            } catch (e: Throwable) {
                lastError = e
                if (attempt == maxRetries || !isRetryable(e)) throw e

                val delay = calculateDelay(attempt)
                delay(delay)
            }
        }

        throw RetryExhaustedException(lastError!!, maxRetries)
    }

    private fun calculateDelay(attempt: Int): Long {
        val exponential = baseDelayMs * (1L shl attempt)  // 2^attempt
        val capped = minOf(exponential, maxDelayMs)
        val jitterAmount = (capped * jitter).toLong()
        val jittered = capped + (Random.nextLong(-jitterAmount, jitterAmount))
        return jittered.coerceAtLeast(1)  // Minimum 1ms
    }
}
```

### Layer 2: Circuit Breaker

```javascript
class CircuitBreaker {
    constructor(options = {}) {
        this.failureThreshold = options.failureThreshold ?? 5;  // 5 failures → OPEN
        this.cooldownMs = options.cooldownMs ?? 30000;          // 30s cooldown
        this.halfOpenMaxRequests = options.halfOpenMaxRequests ?? 1; // 1 probe request

        this.state = 'CLOSED';   // CLOSED | OPEN | HALF_OPEN
        this.failureCount = 0;
        this.lastFailureTime = 0;
        this.halfOpenSuccesses = 0;
    }

    async call(fn) {
        if (this.state === 'OPEN') {
            // Check if cooldown expired → move to HALF_OPEN
            if (Date.now() - this.lastFailureTime >= this.cooldownMs) {
                this.state = 'HALF_OPEN';
                this.halfOpenSuccesses = 0;
            } else {
                throw new CircuitBreakerOpenError('Circuit breaker is OPEN');
            }
        }

        try {
            const result = await fn();

            // Success — handle state transitions
            if (this.state === 'HALF_OPEN') {
                this.halfOpenSuccesses++;
                if (this.halfOpenSuccesses >= this.halfOpenMaxRequests) {
                    this.state = 'CLOSED';
                    this.failureCount = 0;
                }
            }

            // In CLOSED state, reset on success
            if (this.state === 'CLOSED') {
                this.failureCount = 0;
            }

            return result;

        } catch (err) {
            this.failureCount++;
            this.lastFailureTime = Date.now();

            if (this.failureCount >= this.failureThreshold) {
                this.state = 'OPEN';
            }

            throw err;
        }
    }

    getState() { return this.state; }
}
```

### Layer 3: Idempotency Key

```javascript
// Middleware: extract or require idempotency key
function requireIdempotencyKey(req, res, next) {
    const key = req.headers['idempotency-key'] || req.body.idempotencyKey;
    if (!key) {
        return res.status(400).json({
            success: false,
            error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key header required' }
        });
    }
    req.idempotencyKey = key;
    next();
}

// Service: deduplicate by key
async function processWithIdempotency(key, fn) {
    const cached = await cacheService.get(`idempotent:${key}`);
    if (cached) {
        return cached;  // Return previous result
    }

    const result = await fn();

    // Cache result for 24h (idempotency window)
    await cacheService.set(`idempotent:${key}`, result, 86400);
    return result;
}
```

## Combining All 3 Layers

```javascript
class ResilientClient {
    constructor(options = {}) {
        this.retry = new RetryPolicy(options.retry);
        this.circuitBreaker = new CircuitBreaker(options.circuit);
    }

    async request(fn) {
        // Circuit breaker wraps retry, retry wraps the actual call
        return this.circuitBreaker.call(() =>
            this.retry.execute(fn)
        );
    }
}

// Usage
const client = new ResilientClient({
    retry: { maxRetries: 3, baseDelayMs: 200 },
    circuit: { failureThreshold: 5, cooldownMs: 30000 }
});

// Idempotency is separate — it's the caller's responsibility
const result = await client.request(() =>
    processWithIdempotency(key, () => externalApiCall(data))
);
```

## Which Errors Are Retryable

```javascript
const RETRYABLE_ERRORS = new Set([
    // Network
    'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EAI_AGAIN', 'ENOTFOUND',
    'EPIPE', 'EPROTOCOL', 'EADDRNOTAVAIL',
    // HTTP
    '429', '503', '502', '504',
]);

const NON_RETRYABLE_ERRORS = new Set([
    // Client errors — retrying won't help
    '400', '401', '403', '404', '405', '409', '422',
    // Data errors
    'ENOENT', 'EACCES', 'EPERM',
    // Parsing errors
    'SyntaxError', 'ValidationError',
]);
```

## Config Per Service

```javascript
const retryConfigs = {
    redis: {
        maxRetries: 3,
        baseDelayMs: 50,       // Redis is fast, retry quickly
        maxDelayMs: 1000,
        timeoutMs: 500,
        retryableCodes: ['ECONNRESET', 'ETIMEDOUT'],
    },
    database: {
        maxRetries: 2,
        baseDelayMs: 1000,     // DB queries take longer
        maxDelayMs: 5000,
        timeoutMs: 10000,
        retryableCodes: ['40001', '40P01'], // Serialization/deadlock errors only
    },
    externalApi: {
        maxRetries: 3,
        baseDelayMs: 1000,     // External APIs are slow
        maxDelayMs: 30000,     // But cap at 30s total
        timeoutMs: 30000,
        retryableCodes: ['429', '503', '502'],
        circuitBreaker: {
            failureThreshold: 10,
            cooldownMs: 60000,  // 1 min cooldown for external API
        }
    },
};
```

## Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Retry immediately (no backoff) | Exponential backoff — 200ms → 400ms → 800ms |
| No jitter (all retries collide) | Add ±10% random jitter to each delay |
| Retry non-retryable errors (4xx) | Only retry network/5xx errors. 4xx = fix the request. |
| Infinite retries | Max 3 retries (or configurable MAX_RETRIES) |
| Retry without circuit breaker | After N failures, stop trying for M seconds (circuit breaker prevents thundering herd) |
| No idempotency (duplicates on retry) | Idempotency key on all mutation operations |
| Same timeout for every attempt | Base delay short, max delay capped, total timeout bounded |
| Kotlin/JS: retrying inside a coroutine without checking for cancellation | Check `currentCoroutineContext().isActive` before each retry attempt |

## Checklist

- [ ] Retry policy: exponential backoff with jitter (not fixed delay)
- [ ] Max retries set (never infinite)
- [ ] Only retryable errors trigger retry (not 4xx)
- [ ] Circuit breaker wraps retry calls
- [ ] Idempotency key on all mutation endpoints
- [ ] Retry config varies by service (Redis ≠ DB ≠ external API)
- [ ] Total time bound: maxRetries × (baseDelay × 2^maxRetries) does not exceed acceptable limit
- [ ] Tests: verify retry behavior with controlled failures
- [ ] Tests: verify circuit breaker transitions (CLOSED → OPEN → HALF_OPEN → CLOSED)
- [ ] Tests: verify idempotency (same key + same payload = same response, no side effects)
