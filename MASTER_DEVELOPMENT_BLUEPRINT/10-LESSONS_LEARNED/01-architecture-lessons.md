# Architecture Lessons Learned

## Lesson 1: Provider Abstraction Is the Most Important Architectural Decision

**What went wrong**: Early versions of the system called Redis directly from every service. Switching to PostgreSQL (or even testing without Redis) required changing every file. Migration to a provider-agnostic design was a massive refactor.

**Pattern**: Before writing the first line of cache/storage code, define an interface. Every service depends on the interface, not the implementation.

```javascript
// ✅ Define interface FIRST
class ICacheService {
  async connect() { throw 'Not implemented'; }
  async set(key, val, ttlSeconds) { throw 'Not implemented'; }
  async get(key) { throw 'Not implemented'; }
  async del(key) { throw 'Not implemented'; }
  async hSet(key, field, val) { throw 'Not implemented'; }
  async hGet(key, field) { throw 'Not implemented'; }
  async hGetAll(key) { throw 'Not implemented'; }
  async scan(pattern) { throw 'Not implemented'; }
  async keys(pattern) { throw 'Not implemented'; }
}
```

Three implementations:
| Implementation | When | Why |
|----------------|------|-----|
| `RedisCacheService` | Production | Fast, distributed, TTL built-in |
| `MemoryCacheService` | Test | Zero dependencies, fast startup |
| `HybridCacheService` | Critical data | Redis with PostgreSQL fallback for durability |

```javascript
// ServiceFactory — environment-aware provider selection
const service = ServiceFactory.createCacheService({
  redisClient: redis,
  dbService: db,
  logger: logger
});
// CACHE_PROVIDER=redis      → RedisCacheService
// CACHE_PROVIDER=memory     → MemoryCacheService
// CACHE_PROVIDER=redis-hybrid → HybridCacheService
```

**Result**: Changing from Redis to KeyDB to PostgreSQL requires one env var change. The same interface supports production, development, and test without code changes.

## Lesson 2: KMP Strict Separation — No Platform Code in commonMain

**What went wrong**: Android imports (`android.content.Context`) leaked into `commonMain`, making the module un-compilable for JS and iOS targets.

**Pattern**: `commonMain` is pure Kotlin stdlib only. Platform-specific code goes in `androidMain`, `jsMain`, `iosMain` via `expect`/`actual`.

```kotlin
// ✅ commonMain — pure Kotlin, no platform imports
expect class SecureRandom {
    fun nextBytes(bytes: ByteArray)
    fun nextInt(bound: Int): Int
}

// ✅ androidMain
actual class SecureRandom {
    actual fun nextBytes(bytes: ByteArray) {
        java.security.SecureRandom().nextBytes(bytes)
    }
}

// ✅ jsMain
actual class SecureRandom {
    actual fun nextBytes(bytes: ByteArray) {
        val uint8Array = js("new Uint8Array(bytes.length)")
        js("window.crypto.getRandomValues(uint8Array)")
    }
}

// ❌ WRONG — Android import in commonMain
// import android.content.Context
```

**Verification**:
```bash
# CI check: zero Android imports in commonMain
find sdk/src/commonMain -name "*.kt" | xargs grep -l "import android\." | wc -l
# Expected: 0
```

## Lesson 3: No Circular Module Dependencies

**What went wrong**: `merchant` and `enrollment` modules imported each other — any change in one could break the other. Build times increased, test isolation was impossible.

**Pattern**: Enforce strict single-direction dependency chain:

```
✅ Correct:
  merchant ──→ sdk
  enrollment ──→ sdk
  psp-sdk ──→ sdk

❌ Forbidden:
  merchant ←→ enrollment
```

The SDK is the single source of truth. All shared code lives there.

## Lesson 4: Stateless Services (No Module-Level Mutable State)

**What went wrong**: A singleton service stored mutable state at the module level. In tests, state leaked between test cases. In production, concurrent requests corrupted shared state.

**Pattern**: Services are stateless factories. All state is passed in or stored in Redis/DB.

```kotlin
// ❌ Wrong — module-level mutable state
object Processor {
    private var currentState: String = ""
    fun process(input: String): String {
        currentState = transform(input)  // shared mutable state!
        return currentState
    }
}

// ✅ Correct — stateless
class Processor(private val cacheService: ICacheService) {
    suspend fun process(input: String, sessionId: String): String {
        val result = transform(input)
        cacheService.set(`session:${sessionId}:result`, result, 3600)
        return result
    }
}
```

## Lesson 5: The 3-Layer Violation Detection System

**What went wrong**: A single pre-push hook got bypassed with `--no-verify`. No other layer caught the violation. Bad code shipped.

**Pattern**: Three independent layers, each catches what the previous one misses:

```
Layer 1: Startup Validator
  When: Server boot
  Catches: Missing env vars, mock mode in production, algorithm mismatch
  Bypass: None (server still starts, but logs are in observability)
  File: utils/startupValidator.js

Layer 2: Pre-Push Agent (Git Hook)
  When: git push
  Catches: Docs not updated, compilation errors, pattern violations
  Bypass: git push --no-verify
  File: scripts/pre-push-agent.sh (The Sentry)

Layer 3: CI Audit Script
  When: CI pipeline (GitHub Actions)
  Catches: console.log in production code, missing TTLs, non-constant-time comparisons
  Bypass: None (blocks PR merge)
  File: scripts/audit-violations.sh
```

**Key insight**: Layer 1 and Layer 3 have no bypass. Layer 2 (git hook) can be bypassed, but the other two layers catch those bypasses.

## Lesson 6: Templates Prevent Pattern Drift

**What went wrong**: 49 backend routers had different import styles, error handling patterns, and auth middleware configurations. New files copied from old files that themselves had variations.

**Pattern**: Maintain canonical templates for every file type. New files start from the template, not from copying an existing file.

```
backend/templates/
  ├── router.js     # verified imports, auth middleware pattern, audit logging
  └── service.js    # verified imports, error handling, Redis TTL pattern
```

```javascript
// When creating a new router:
// 1. Read backend/templates/router.js
// 2. Copy to routes/<name>Router.js
// 3. Only change the business logic — don't re-invent the patterns
```

## Lesson 7: The JS Object Singleton Trap (Kotlin/JS)

**What went wrong**: In Kotlin/JS `object` singletons, parameters assigned in `render()` don't persist to `submit()`. The IR compiler doesn't preserve runtime state between function calls.

**Pattern**: Always assign parameters to `this.field` in `render()`:

```kotlin
// ❌ Wrong — uuid will be null in submit()
object PinCanvas {
    fun render(root: Element, uuid: String) {
        root.append {
            button {
                onClickFunction { submit() }
            }
        }
    }
    fun submit() {
        // this.uuid is null here!
    }
}

// ✅ Correct
object PinCanvas {
    private var uuid: String = ""
    fun render(root: Element, uuid: String, forceRender: Boolean = false) {
        this.uuid = uuid  // ← persist to instance field
        root.append {
            button { onClickFunction { submit() } }
        }
    }
    fun submit() {
        val uuid = this.uuid  // ← reads from instance field
    }
}
```

## Lesson 8: Yarn Lock Auto-Repair (KMP Gradle)

**What went wrong**: Different Gradle task combinations (`jsBrowserTest` vs `compileKotlinJs`) pull in different npm dev packages. The yarn lock file would mismatch, failing the build.

**Pattern**: Auto-repair the lock file instead of failing:

```kotlin
// build.gradle.kts (root)
plugins.withType<YarnPlugin> {
    the<YarnRootExtension>().apply {
        yarnLockMismatchReport = YarnLockMismatchReport.WARNING  // warn, don't fail
        reportNewYarnLock = false
        yarnLockAutoReplace = true  // auto-fix on mismatch
    }
}
```

## Lesson 9: Canvas Listeners Need `document`-Level Events

**What went wrong**: Drawing canvases registered `mouseup` only on the canvas element. On desktop, if the user dragged outside the canvas and released, the `mouseup` event was never fired — the drawing state was permanently "active."

**Pattern**: Always register document-level mouseup/pointerup + mouseleave:

```javascript
// ❌ Wrong — breaks when mouse leaves canvas
canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mouseup', endDraw);

// ✅ Correct — survives mouse leave
canvas.addEventListener('mousedown', startDraw);
document.addEventListener('mouseup', endDraw);
document.addEventListener('mouseleave', endDraw);
```

## Lesson 10: expect/actual Class Must List All Members (Kotlin 2.x)

**What went wrong**: Kotlin 2.x K2 compiler does not infer abstract members from `expect class : Interface`. The build compiles fine on JVM but fails on JS.

**Pattern**: List ALL abstract members explicitly:

```kotlin
// ❌ Wrong — K2 doesn't infer these
expect class ZkProofGenerator : ProofGenerator {
    suspend fun generateProof(...): Result<ZkProof>
}

// ✅ Correct — K2 requires explicit member list
expect class ZkProofGenerator : ProofGenerator {
    suspend fun generateProof(...): Result<ZkProof>
    suspend fun verifyProof(...): Result<Boolean>  // ← list EVERY abstract member
}
```
