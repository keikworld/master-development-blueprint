# Coding Standards

## Language Conventions

### JavaScript / Node.js

```javascript
// Naming
const CONSTANT_VALUE = 'UPPER_SNAKE';     // Constants
let regularVariable = 'camelCase';         // Variables
function doSomething() {}                  // Functions (camelCase)
class ApiService {}                        // Classes (PascalCase)
METHOD_NAME = 'GET';                       // Method names (UPPER_SNAKE)

// Imports
const { specific } = require('../utils/module');  // Destructure imports
const logger = require('../utils/logger');        // Logger at module level

// General rules
// - Max 50 lines per function — split into smaller functions
// - Prefer early returns over nested if-else
// - Use async/await over raw promises
// - Prefix unused params with _ underscore
```

### Kotlin (KMP)

```kotlin
// Naming conventions (Official Kotlin Style Guide)
const val CONSTANT_VALUE = "UPPER_SNAKE"
var regularVariable = "camelCase"
fun doSomething() {}                             // camelCase
class ApiService                                 // PascalCase
interface DataSource                             // PascalCase + "able" suffix for capabilities

// String templates over concatenation
println("Hello, $name")

// Prefer enum over constant strings for fixed sets
enum class Factor { PIN, PATTERN, EMOJI }

// General rules
// - KDoc for public APIs (not internal)
// - Safe calls (?.) > non-null assertions (!!)
// - Dispatchers.IO for I/O, Dispatchers.Default for CPU
// - No platform imports in commonMain (use expect/actual)
```

---

## Architectural Rules

### Module Dependency Rules

```
SDK (layer 0)       → No dependencies on any other internal module
Enrollment (layer 1)→ May depend on SDK only
Merchant  (layer 2) → May depend on SDK only
Web (layer 2)       → May depend on SDK only
PSP-SDK (layer 1)   → May depend on SDK only

❌ FORBIDDEN: merchant ↔ enrollment (circular dependency)
❌ FORBIDDEN: enrollment → merchant
✅ ALLOWED: Both → SDK
```

### State Management

```javascript
// ❌ FORBIDDEN — Module-level mutable state
let activeSessions = {};  // Memory leak, concurrency issues

// ✅ CORRECT — Factory function, each call creates new instance
function createSessionManager() {
    const sessions = new Map();
    return {
        create(id) { sessions.set(id, {}) },
        get(id) { return sessions.get(id) }
    };
}
```

### Provider Abstraction

```javascript
// ❌ FORBIDDEN — Direct Redis/DB calls
const redis = require('redis');
const client = redis.createClient();
await client.set('key', value);

// ✅ CORRECT — Through abstraction layer
const cacheService = ServiceFactory.getCacheService();
await cacheService.set('key', value, TTL);
```

### No Private DB Pools

```javascript
// ❌ FORBIDDEN — Creating private database pools
const { Pool } = require('pg');
const pool = new Pool({ /* config */ });

// ✅ CORRECT — Use dbService abstraction
const dbService = require('../services/dbService');
await dbService.query('SELECT 1');
```

### Stateless Services

```javascript
// ❌ FORBIDDEN — Module-level mutable state in services
let userCount = 0;  // Not thread-safe, kills horizontal scaling

// ✅ CORRECT — Stateless, all state in request or external store
async function getUserCount(dbService) {
    return dbService.query('SELECT COUNT(*) FROM users');
}
```

### Service Template Pattern

Every service file follows this structure:

```javascript
// Path: backend/services/YourService.js

const crypto = require('crypto');
const logger = require('../utils/logger');
const { safeErrorMessage } = require('../utils/safeErrorResponse');
const { constantTimeCompare } = require('../utils/constantTimeCompare');

class YourService {
    constructor(dbPool) {
        this.db = dbPool;  // NEVER create private pools
    }

    async exampleMethod({ uuid, data }) {
        try {
            // Implement logic here
            // Wipe secrets in finally block:
            // const key = Buffer.from(secret, 'hex');
            // try { ... } finally { key.fill(0); }
            return { success: true, data: result };
        } catch (error) {
            logger.error('[YourService] method error:', error.message);
            return { success: false, error: safeErrorMessage(error) };
        }
    }
}

// Factory function (not module-level export):
let _instance = null;
function getYourService(dbPool) {
    if (!_instance && dbPool) {
        _instance = new YourService(dbPool);
    }
    return _instance;
}

module.exports = { YourService, getYourService };
```

### Router Template Pattern

Every route file follows this structure:

```javascript
// Path: backend/routes/yourRouter.js
// Imports are VERIFIED against source files — do not change paths

const express = require('express');
const crypto = require('crypto');
const { pool } = require('../database/database');
const { AuditService, EVENT_TYPES, SEVERITY } = require('../services/AuditService');
const logger = require('../utils/logger');
const { anonymizeIP } = require('../utils/privacyUtils');
const { safeErrorMessage } = require('../utils/safeErrorResponse');
const { constantTimeCompare } = require('../utils/constantTimeCompare');

const router = express.Router();
const auditService = new AuditService(pool);

// GET endpoint
router.get('/example', async (req, res) => {
    try {
        res.json({ data: result });
    } catch (error) {
        logger.error('GET /example error:', error.message);
        res.status(500).json({ error: safeErrorMessage(error, 'Failed') });
    }
});

// POST endpoint
router.post('/example', async (req, res) => {
    const { field } = req.body;
    // Validate...
    try {
        await auditService.logEvent({
            eventType: 'EVENT_TYPE',
            uuid: req.auth?.uuid,
            ipAddress: anonymizeIP(req.ip),
            userAgent: req.headers['user-agent'],
            details: {},
            severity: SEVERITY.INFO
        });
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        logger.error('POST /example error:', error.message);
        res.status(500).json({ error: safeErrorMessage(error, 'Failed') });
    }
});

module.exports = router;
```

---

## API Design Patterns

### Route Handler Template

```javascript
const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { validateBody } = require('../middleware/validateBody');

const SERVICE_ROUTES = {
    MAIN: '/v1/resource'
};

router.post(SERVICE_ROUTES.MAIN,
    rateLimiter,
    authMiddleware(),
    validateBody(schema),
    async (req, res, next) => {
        try {
            const result = await someService.handler(req.body);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);
```

### Error Handling

```javascript
// ✅ CORRECT — Safe error response
const { APIError } = require('../utils/APIError');
const LOGGER = require('../utils/logger');

router.use((error, req, res, _next) => {
    LOGGER.error('Request failed:', error.message);

    if (error instanceof APIError) {
        return res.status(error.statusCode).json({
            success: false,
            error: { code: error.code }
        });
    }
    return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR' }
    });
});

// ❌ WRONG — Leaking internal details
return res.status(500).json({
    success: false,
    error: {
        message: error.message,          // May leak info
        stack: error.stack,              // Stack trace leak
        internalCode: error.internalCode // Internal enumeration
    }
});
```

---

## Input Sanitization

### XSS/SQL Injection Prevention

```javascript
// backend/middleware/security.js
function sanitizeString(input) {
    if (typeof input !== 'string') return input;
    return input
        .replace(/[<>]/g, '')               // Remove < and >
        .replace(/javascript:/gi, '')        // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '')          // Remove event handlers
        .trim();
}

function sanitizeObject(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return sanitizeString(obj);
    if (Array.isArray(obj)) return obj.map(sanitizeObject);
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj))
            sanitized[sanitizeString(key)] = sanitizeObject(value);
        return sanitized;
    }
    return obj;
}

// Apply as middleware to all requests:
function sanitizeInputs(req, res, next) {
    if (req.body) req.body = sanitizeObject(req.body);
    if (req.query) req.query = sanitizeObject(req.query);
    if (req.params) req.params = sanitizeObject(req.params);
    next();
}
```

## Security Patterns

### Constant-Time Comparisons

```javascript
// ✅ CORRECT
const { constantTimeCompare } = require('./constantTimeCompare');
if (!constantTimeCompare(input, stored)) {
    throw new Error('Mismatch');
}

// ❌ WRONG — Timing oracle
if (input !== stored) {
    throw new Error('Mismatch');
}
```

### Memory Wiping

```javascript
// ✅ CORRECT — Always wipe in finally block
function processDigest(input) {
    const buf = Buffer.from(input);
    try {
        return sha256(buf);
    } finally {
        buf.fill(0);
    }
}
```

### No Early Returns in Verification

```javascript
// ✅ CORRECT — Always compute full digest
async function verify(userInput, stored) {
    const digest = await sha256Suspend(userInput);
    return constantTimeCompare(digest, stored);
    // Even if userInput clearly won't match, still compute
}
```

### CSPRNG Only

```javascript
// ✅ CORRECT
const nonce = crypto.randomUUID();
const bytes = crypto.randomBytes(32);

// ❌ WRONG
const nonce = Math.random().toString(36);
```

---

## KMP-Specific Rules

### No Platform Imports in commonMain

```kotlin
// ❌ WRONG in commonMain
import android.util.Base64

// ✅ CORRECT
expect class PlatformEncoder {
    fun encode(input: ByteArray): String
}
```

### expect class: Interface (Kotlin 2.x K2)

```kotlin
// ✅ CORRECT — List ALL abstract members explicitly
expect class SecureEncoder : SecureEncoderInterface {
    // K2 does NOT infer abstract members — must list all
    override fun encode(data: ByteArray): ByteArray
    override fun decode(data: ByteArray): ByteArray
}
```

### commonTest for Platform-Independent Tests Only

```kotlin
// ❌ WRONG — commonTest runs on JS too (where sync sha256 fails)
class CryptoTest {
    @Test
    fun testSha256() {
        val hash = sha256("test".encodeToByteArray())  // Fails on JS!
    }
}

// ✅ CORRECT — Platform-specific test location
// Place in: src/test/kotlin/ (not commonTest)
class CryptoTest {
    @Test
    fun testSha256() {
        val hash = sha256("test".encodeToByteArray())
    }
}
```

---

## Kotlin/JS-Specific Rules

### Object Singleton Parameter Persistence

```javascript
// ❌ WRONG — Params passed to render() don't persist to submit()
object PinCanvas : Canvas() {
    override fun render(root: Element, params: Params) {
        // params.pin only valid HERE
        submitButton.onClickFunction = {
            validatePin(params.pin)  // params.pin is UNDEFINED
        }
    }
}

// ✅ CORRECT — Save params to this.field in render()
object PinCanvas : Canvas() {
    var pin: String? = null

    override fun render(root: Element, params: Params) {
        this.pin = params.pin  // Persist
        submitButton.onClickFunction = {
            validatePin(this.pin)
        }
    }
}
```

### Canvas Drawing Listeners

```javascript
// ✅ CORRECT — Register document-level listeners for mouse leave
canvas.addMouseDownListener { /* draw */ }
document.addMouseUpListener { /* stop drawing */ }
document.addMouseLeaveListener { /* stop drawing (user left page) */ }

// ❌ WRONG — Element-only mouseup breaks when cursor leaves canvas
canvas.addMouseDownListener { /* draw */ }
canvas.addMouseUpListener { /* stop drawing */ }  // Never fires if cursor leaves canvas
```
