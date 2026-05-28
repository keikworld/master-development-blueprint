# API Design

## RESTful API Conventions

### Base URL
```
Production:  https://api.example.com/v1
Staging:     https://api-staging.example.com/v1
Local:       http://localhost:3000/api/v1
```

### URL Structure
```
/v1/{resource}                  # Collection (GET, POST)
/v1/{resource}/{id}             # Single resource (GET, PUT, DELETE)
/v1/{resource}/{id}/{sub}       # Sub-resource
/v1/{resource}/{action}         # Action (non-CRUD operations)
```

### HTTP Methods

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Retrieve resource(s) | ✅ Yes | ✅ Yes |
| POST | Create / Action | ❌ No | ❌ |
| PUT | Full replace | ✅ Yes | ❌ |
| PATCH | Partial update | ❌ No | ❌ |
| DELETE | Remove resource | ✅ Yes | ❌ |

### Response Envelope

```json
// Success
{
    "success": true,
    "data": { ... },
    "meta": {
        "timestamp": "2026-05-27T12:00:00Z",
        "request_id": "uuid"
    }
}

// Error
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid input format"
    },
    "meta": {
        "timestamp": "2026-05-27T12:00:00Z",
        "request_id": "uuid"
    }
}
```

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | GET, PUT, PATCH success |
| 201 | Created | POST success (new resource) |
| 204 | No Content | DELETE success |
| 400 | Bad Request | Validation failure, malformed input |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource, race condition |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Unhandled server error (never leak details) |

### Error Response Security

**NEVER return these in error messages:**
- Stack traces
- Internal file paths
- Database error details
- Whether a user exists (user enumeration prevention)
- Which part of auth failed (timing attack prevention)

```javascript
// ❌ WRONG — leaks information
res.status(401).json({ error: 'User not found' });

// ✅ CORRECT — generic message (user enumeration prevention)
res.status(401).json({ error: 'Invalid credentials' });

// ❌ WRONG — leaks internals
res.status(500).json({ error: error.message });

// ✅ CORRECT — safe message
const { safeErrorMessage } = require('../utils/safeErrorResponse');
res.status(500).json({ error: safeErrorMessage(error, 'Operation failed') });
```

---

## Authentication Headers

### JWT Auth
```
Authorization: Bearer <jwt-token>
X-Nonce: <uuid-v4>
X-Timestamp: <unix-ms>
```

### API Key Auth
```
X-API-Key: <api-key>
X-Nonce: <uuid-v4>
X-Timestamp: <unix-ms>
```

### Why Nonce + Timestamp?
- **Timestamp** — Rejects requests with clock drift > 30s (replay prevention)
- **Nonce** — Prevents replay of captured requests within the timestamp window
- Both enforced by middleware; public read-only routes skip validation

---

## Versioning

### URL Path Versioning
```
/v1/resource
/v2/resource
```

### Rules
1. **Backward compatible** — v1 endpoints never change behavior without a version bump
2. **Deprecation period** — Old versions maintain minimum 6 months support
3. **Migration guide** — Each version bump includes a migration document
4. **Headers** — Optional `Accept-Version` header for override

---

## Route Template

```javascript
// backend/routes/resourceRouter.js
const express = require('express');
const router = express.Router();

// Auth middleware
const { requireAuth } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/requirePermission');
const { strictSSRFProtection } = require('../middleware/ssrfProtection');

// Validation
const { validateUUID } = require('../utils/validators');

// GET /v1/resource — List (paginated)
router.get('/', requireAuth, async (req, res) => {
    const { limit = 50, offset = 0 } = req.query;
    // Parse with defaults, cap at max
    const pageSize = Math.min(parseInt(limit, 10) || 50, 200);
    const pageOffset = parseInt(offset, 10) || 0;
    // ... business logic
});

// GET /v1/resource/:id — Single
router.get('/:id', requireAuth, async (req, res) => {
    // ... retrieve by ID
});

// POST /v1/resource — Create
router.post('/', requireAuth, strictSSRFProtection, async (req, res) => {
    // ... create resource
});

// PUT /v1/resource/:id — Update
router.put('/:id', requireAuth, async (req, res) => {
    // ... full update
});

// DELETE /v1/resource/:id — Delete
router.delete('/:id', requireAuth, async (req, res) => {
    // ... soft or hard delete
});

module.exports = router;
```

---

## Request Validation Checklist

Every endpoint MUST validate:

- [ ] UUID format (if UUID in path/body)
- [ ] Email format (if email in body)
- [ ] URL safety (SSRF check if URL in body)
- [ ] Numeric ranges (limit, offset, amounts)
- [ ] String lengths (prevent buffer overflow)
- [ ] Enum values (only allowed values for status, type, etc.)
- [ ] Currency codes (ISO 4217 if amount involved)
- [ ] IP format (if IP in body — and prefer req.ip over body)
