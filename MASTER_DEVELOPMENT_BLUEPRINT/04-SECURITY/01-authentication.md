# Authentication Architecture

## Auth Flow Overview

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│  Auth    │────▶│ Identity │────▶│  Token   │
│          │     │ Middleware│     │ Provider │     │  Issuance│
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                               │
                                               ▼
                                        ┌──────────┐
                                        │ Response │
                                        │ + Token  │
                                        └──────────┘
```

## Auth Methods

### Method 1: JWT (Primary)

```javascript
// Token structure
{
    "sub": "uuid",           // User identifier
    "role": "user",          // Role (user, admin, merchant)
    "iat": 1716800000,       // Issued at
    "exp": 1716800900,       // Expires (15 minutes default)
    "jti": "uuid",           // Token ID (for blacklisting)
    "type": "access"         // Token type (access or refresh)
}
```

**Rules:**
- Short expiry (15 minutes default)
- Refresh tokens with 7-day expiry
- Blacklist for immediate revocation (Redis-backed)
- Rotation on use for refresh tokens

### Method 2: API Keys (Machine-to-Machine)

```javascript
// Storage: SHA-256 hash in database
// Client: Prefix for identification (first 8 chars)
// Auth: constantTimeCompare(providedKey, storedHash)

// Keys stored as: hash(api_key) in DB
// Secret half shown once at creation
```

**Rules:**
- SHA-256 hash for storage (not bcrypt — API keys are already high-entropy)
- Prefix-based lookups for efficiency
- Rotation endpoint with key history
- Scope/role attached to each key

### Method 3: Session (Web Apps)

```javascript
// Session ID stored in httpOnly cookie
// Session data in Redis (cacheService)
// CSRF token for state-changing operations
```

## Auth Middleware Stack

Every authenticated endpoint passes through:

```
1. Input Sanitizer (XSS, SQL injection protection)
2. Rate Limiter (sliding window, per-IP + per-user)
3. Nonce/Replay Protection (GET public routes skip)
4. JWT/API Key Verifier (extract + validate token)
5. RBAC / Permission Checker (role-based permissions)
6. Ownership Checker (UUID match, resource-level auth)
7. Audit Logger (event recording)
```

## Auth Middleware Patterns

### requireAuth (Standard Token Verification)

Extracts `Authorization: Bearer <token>`, verifies signature, checks expiry (15 min default). Attaches `req.auth` with uuid, expiry, remaining time.

```javascript
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) { /* 401, "No authorization header" */ }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') { /* 401 */ }

    const token = parts[1];
    const result = tokenManager.verify(token);

    if (!result.valid) {
        return res.status(result.expired ? 401 : 403).json({
            success: false, error: result.error, expired: result.expired
        });
    }

    req.auth = { uuid: result.uuid, expiresAt: result.expiresAt, token };
    logger.debug(`Authenticated: ${result.uuid.slice(0, 8)}...`);
    next();
}
```

### requireUUIDMatch (Ownership Check)

Must be used AFTER requireAuth. Verifies the authenticated user UUID matches `:uuid` route param.

```javascript
function requireUUIDMatch(req, res, next) {
    if (req.params.uuid !== req.auth?.uuid) {
        logger.warn(`UUID mismatch: route=${route.slice(0,8)} auth=${auth.slice(0,8)}`);
        return res.status(403).json({ error: 'UUID mismatch', message: 'Access own account only' });
    }
    next();
}
```

### optionalAuth (Authenticate if Token Present)

For endpoints that work differently for authenticated vs anonymous users. Doesn't fail if no token.

```javascript
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) { req.auth = null; return next(); }
    // ...verify token, set req.auth if valid, null if not...
    next();
}
```

### Role-Specific Auth Middleware

Each role has its own auth middleware that validates role-specific tokens:

| Middleware | Validates | Used For |
|-----------|-----------|----------|
| `userAuth.js` | User JWT | Web/mobile API |
| `merchantAuth.js` | Merchant token | Merchant dashboard |
| `adminAuth.js` | Admin JWT | Admin panel |
| `developerAuth.js` | Developer API key | Developer portal |
| `agentAuth.js` | Agent token | Internal agent API |
| `apiKeyValidator.js` | API key + signature | M2M integrations |
| `billingAuth.js` | Billing token | Payment webhooks |
| `sessionManager.js` | Session cookie | Web app sessions |

## Replay Protection

```javascript
// Every state-changing request includes:
// X-Nonce: <uuid-v4>      — Unique per request
// X-Timestamp: <unix-ms>  — Current time

// Middleware checks:
// 1. Timestamp within 30s of server time (clock drift)
// 2. Nonce not seen before (Redis TTL 5 minutes)
// 3. Nonce valid UUID format

// Public GET routes SKIP this check (discoverable endpoints)
const PUBLIC_ROUTES = [
    { path: '/v1/supported', method: 'GET' },
    { path: '/health', method: 'GET' },
    { path: '/ping', method: 'GET' }
];
```

## Rate Limiting

| Limit Type | Window | Max Requests | Storage |
|------------|--------|-------------|---------|
| Per-IP | 60 seconds | 100 | Redis (sliding window) |
| Per-user | 60 seconds | 200 | Redis (sliding window) |
| Per-endpoint | Configurable | Configurable | Redis |
| Login attempts | 1 hour | 5 (per-account lockout) | Redis |

## Authorization (RBAC)

### Role Hierarchy

```
super_admin      → Full system access
security_admin   → Security events, audit logs
support_admin    → User management (read + update)
developer        → API key management, webhooks
billing_admin    → Payment data, invoices
user             → Own data only
```

### Permission Model

```javascript
const PERMISSIONS = {
    'user:read':      ['super_admin', 'support_admin', 'user'],
    'user:write':     ['super_admin', 'user'],
    'admin:read':     ['super_admin', 'security_admin'],
    'admin:write':    ['super_admin'],
    'billing:read':   ['super_admin', 'billing_admin'],
    'billing:write':  ['super_admin', 'billing_admin'],
    'audit:read':     ['super_admin', 'security_admin'],
    'webhook:manage': ['super_admin', 'developer'],
    'api_key:manage': ['super_admin', 'developer']
};
```

## Token Management

### JWT Blacklist (Redis-backed)

```javascript
// On logout / security event:
await cacheService.set(`blacklist:${jti}`, 'true', TOKEN_BLACKLIST_TTL);

// In middleware:
if (await cacheService.exists(`blacklist:${jti}`)) {
    return res.status(401).json({ error: 'Token revoked' });
}
```

### Key Rotation

```javascript
// JWT secrets stored with version:
const secrets = {
    v1: 'current-secret',
    v2: 'previous-secret'  // For tokens issued before rotation
};

// Verify with all active versions
// Sign with current version only
```
