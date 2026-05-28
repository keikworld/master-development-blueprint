# Pattern Gallery: How Each Rule Looks in Your Language

The blueprint rules are language-agnostic, but implementation varies. Use this gallery to adapt each pattern to your stack.

---

## Universal Rule 1: No console.log

Use a structured logger with auto-redaction of secrets.

| Language | Do This | Instead of |
|----------|---------|-----------|
| **Node.js** | `pino.info({ userId }, 'event')` | `console.log('user:', userId)` |
| **Python** | `logger.info('event', extra={'user': user_id})` | `print(f'user: {user_id}')` |
| **Go** | `slog.Info("event", "user", userID)` | `fmt.Printf("user: %v\n", userID)` |
| **Rust** | `info!("event"; "user" => user_id)` | `println!("user: {}", user_id)` |
| **Java** | `log.info("event {}", user)` | `System.out.println("user: " + user)` |

**Auto-redaction**: Configure your logger to censor sensitive fields (password, token, secret, authorization).

**Python example with structlog:**
```python
import structlog
logger = structlog.get_logger()
logger.info("user.login", user_id=user.id)  # Not print()
```

**Go example with slog (1.21+):**
```go
slog.Info("user.login", "user_id", user.ID)  // Not fmt.Printf
```

---

## Universal Rule 2: No Hardcoded Secrets

Everything sensitive comes from environment variables.

| Language | Do This | Instead of |
|----------|---------|-----------|
| **Node.js** | `process.env.API_KEY` | `const API_KEY = 'sk-123'` |
| **Python** | `os.environ['API_KEY']` | `API_KEY = 'sk-123'` |
| **Go** | `os.Getenv("API_KEY")` | `apiKey := "sk-123"` |
| **Rust** | `std::env::var("API_KEY")` | `let api_key = "sk-123"` |
| **Java** | `System.getenv("API_KEY")` | `String apiKey = "sk-123"` |

**Always:**
- Commit `.env.example` with placeholder values
- Add `.env` to `.gitignore`
- Validate required vars at startup

---

## Universal Rule 3: No Magic Numbers

Every named constant goes in a single config/constants file.

| Language | Do This | Instead of |
|----------|---------|-----------|
| **Node.js** | `const MAX_RETRIES = 3` | `for (let i = 0; i < 3; i++)` |
| **Python** | `MAX_RETRIES = 3` | `for i in range(3):` |
| **Go** | `const MaxRetries = 3` | `for i := 0; i < 3; i++` |
| **Rust** | `const MAX_RETRIES: u32 = 3` | `for i in 0..3 {` |
| **Java** | `static final int MAX_RETRIES = 3` | `for (int i = 0; i < 3; i++)` |

---

## Input Validation (5-Layer Defense)

Check in this order: existence -> type -> size -> format -> semantic.

| Layer | Node.js | Python | Go | Rust |
|-------|---------|--------|----|------|
| **1. Existence** | `if (x === undefined) throw` | `if x is None: raise` | `if x == nil { return }` | `if x.is_none() { bail!() }` |
| **2. Type** | `typeof x === 'string'` | `isinstance(x, str)` | type assertion | `x.downcast::<String>()` |
| **3. Size** | `x.length > MAX` | `len(x) > MAX` | `len(x) > max` | `x.len() > MAX` |
| **4. Format** | `/^pattern$/.test(x)` | `re.match(pattern, x)` | `regexp.MatchString` | `Regex::new(r"^...$")` |
| **5. Semantic** | domain-specific logic | domain-specific | domain-specific | domain-specific |

**Key: Size check BEFORE regex** — prevents ReDoS attacks on large inputs.

---

## Cache Service Abstraction

Interface first, then implementation. Swap later without changing callers.

| Language | Interface | Memory Impl | Redis Impl |
|----------|-----------|-------------|------------|
| **Node.js** | Class with methods | Map-based | ioredis |
| **Python** | Abstract base class | dict-based | redis-py |
| **Go** | Interface | sync.Map | go-redis |
| **Rust** | Trait | HashMap | redis-rs |

**Node.js example:**
```javascript
class MemoryCache {
  constructor() { this._store = new Map() }
  async get(key) { return this._store.get(key) ?? null }
  async set(key, val, ttl) { this._store.set(key, val) }
}
```

---

## Rate Limiting (Sliding Window)

Track request timestamps per client, count within window.

| Language | Approach | Library |
|----------|----------|---------|
| **Node.js** | In-memory Map + timestamps | express-rate-limit |
| **Python** | collections.deque + timestamps | flask-limiter |
| **Go** | sync.Map + []time.Time | golang.org/x/time/rate |
| **Rust** | HashMap + Vec<Instant> | governor |

---

## Retry with Exponential Backoff + Jitter

| Language | Pattern |
|----------|---------|
| **Node.js** | `for (let i = 1; i <= max; i++) { try { return await fn() } catch { await sleep(base * 2**i + jitter()) } }` |
| **Python** | `for i in range(max_attempts): try: return fn() except: sleep(base * 2**i + jitter())` |
| **Go** | `for i := 0; i < max; i++ { if err := fn(); err == nil { return }; time.Sleep(base<<i + jitter()) }` |
| **Rust** | `for i in 0..max { match fn() { Ok(v) => return v, Err(_) => sleep(base * 2u64.pow(i) + jitter()) } }` |

**Never retry:** 4xx errors (client's fault), non-retryable errors should be configurable.

---

## Memory Wiping

Zero out buffers containing secrets after use.

| Language | Secure Erase | Why |
|----------|-------------|-----|
| **Node.js** | `buffer.fill(0)` | Buffer.alloc is mutable |
| **Python** | `bytearray(b'\x00' * len(buf))` | bytes is immutable — use bytearray |
| **Go** | `clear(buf)` (1.21+) or `for i := range buf { buf[i] = 0 }` | Zeroing heap memory |
| **Rust** | `ptr::write_bytes(p, 0, len)` or `zeroize` crate | Compiler can optimize away naive loops |

**Always use `try { ... } finally { wipe() }`** to ensure wipe runs even if code throws.

---

## Constant-Time Comparison

Compare secrets, digests, and tokens without short-circuiting on first mismatch (prevents timing side-channel attacks).

| Language | Do This | Don't Do This |
|----------|---------|---------------|
| **Node.js** | `crypto.timingSafeEqual(a, b)` | `a === b` |
| **Python** | `hmac.compare_digest(a, b)` | `a == b` |
| **Go** | `crypto/subtle.ConstantTimeCompare(a, b)` | `a == b` |
| **Rust** | `subtle::ConstantTimeEq::ct_eq(&a, &b)` | `a == b` |

---

## Graceful Shutdown

| Language | Pattern |
|----------|---------|
| **Node.js** | `process.on('SIGTERM', () => { server.close(() => process.exit(0)); setTimeout(() => process.exit(1), 5000) })` |
| **Python** | `signal.signal(signal.SIGTERM, lambda s,f: (server.shutdown(), sys.exit(0)))` |
| **Go** | `sigCh := make(chan os.Signal, 1); signal.Notify(sigCh, syscall.SIGTERM); <-sigCh; ctx, cancel := context.WithTimeout(...)` |
| **Rust** | `tokio::signal::ctrl_c().await; server.with_graceful_shutdown(signal).await` |

---

## Error Handling (Don't Leak Internals)

| Language | Prod | Dev |
|----------|------|-----|
| **Node.js** | `{ error: 'Internal server error' }` | `{ error: err.message, stack: err.stack }` |
| **Python** | `{'error': 'Internal server error'}` | `{'error': str(e), 'traceback': tb}` |
| **Go** | `http.Error(w, "Internal server error", 500)` | `http.Error(w, err.Error(), 500)` |
| **Rust** | `(StatusCode::INTERNAL_SERVER_ERROR, "Internal error")` | `(StatusCode::INTERNAL_SERVER_ERROR, err.to_string())` |

**Switch based on `NODE_ENV` / `ENVIRONMENT` / `DEBUG` env var.**

---

## Testing Strategy (Tests First)

| Language | Framework | Test File Location | Naming |
|----------|-----------|-------------------|--------|
| **Node.js** | mocha + chai | `tests/` or `__tests__/` | `*.test.js` |
| **Python** | pytest | `tests/` | `test_*.py` |
| **Go** | testing (stdlib) | `*_test.go` alongside | `func Test*(t *testing.T)` |
| **Rust** | #[test] (stdlib) | `tests/` or inline `#[cfg(test)] mod` | `fn test_*()` |
| **Java** | JUnit 5 | `src/test/java/` | `*Test.java` |

**Pattern:** Write the test that fails first -> implement -> test passes -> refactor.
