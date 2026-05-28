# Example: Express API

A complete, runnable Express API demonstrating blueprint patterns and universal rules.

## What This Example Shows

| Rule/Pattern | File(s) | How |
|---|---|---|
| **Universal Rule 1**: No console.log | `src/middleware/structuredLogger.js` | Pino logger with auto-redaction of secrets |
| **Universal Rule 2**: No hardcoded secrets | `src/config/env.js` | All config from env vars with `.env.example` |
| **Universal Rule 3**: No magic numbers | `src/config/constants.js` | All constants named, in one file |
| **Universal Rule 4**: Scanning | `tests/` | Tests verify every behavior |
| **Universal Rule 5**: Dependency scanning | `npm audit` | Listed in CLAUDE.md |
| **Input validation (5-layer)** | `src/middleware/inputValidation.js` | Existence -> Type -> Size -> Format -> Semantic |
| **Cache abstraction** | `src/services/cacheService.js` | MemoryCacheService (swap for Redis later) |
| **Rate limiting (sliding window)** | `src/services/rateLimiter.js` | Per-client sliding window with reset |
| **Retry pattern** | `src/services/retryPattern.js` | Exponential backoff + jitter + circuit breaker |
| **Memory wiping** | `src/utils/memoryWipe.js` | Buffer zeroing after use |
| **Error handling** | `src/middleware/errorHandler.js` | Centralized, doesn't leak internals in production |
| **Graceful shutdown** | `src/index.js` | SIGTERM/SIGINT handler with timeout |

## Run

```bash
cd 12-APPENDIX/03-example-express-api
npm install
npm start          # Start server
npm test           # 33 tests, all passing
```

## Structure

```
src/
  config/constants.js        # All magic numbers as named constants
  config/env.js              # Environment config (no hardcoded secrets)
  middleware/
    structuredLogger.js      # Pino logger (no console.log)
    inputValidation.js       # 5-layer input validation
    errorHandler.js          # Centralized error handling
  services/
    cacheService.js          # ICacheService (MemoryCacheService impl)
    rateLimiter.js           # Sliding window rate limiter
    retryPattern.js          # Exponential backoff + circuit breaker
  utils/memoryWipe.js        # Secure buffer zeroing
  routes/                    # Express routes
  app.js                     # Express app factory
  index.js                   # Server entry point
tests/                       # 33 tests across 7 test suites
```

## Testing Patterns

- Unit tests for services (cache, rate limiter, circuit breaker)
- Integration tests for HTTP endpoints (supertest)
- Validation tests for input functions
- All tests use `describe`/`it`/`expect` (mocha + chai)
