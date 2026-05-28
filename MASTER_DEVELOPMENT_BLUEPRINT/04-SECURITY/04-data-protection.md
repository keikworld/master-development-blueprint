# Data Protection

## Core Principle

> **Collect the LEAST amount of data, for the SHORTEST time, with the STRONGEST protection.**

## Data Classification

| Classification | Definition | Examples | Required Protection |
|---------------|------------|----------|-------------------|
| **Public** | No privacy impact | App version, supported features | None |
| **Internal** | Business sensitive, not personal | Error rates, system metrics | Access control |
| **Personal** | Identifies natural person | Email, IP, device ID | Encryption + Anonymization |
| **Sensitive Personal** | Special category | Biometrics, health, genetics | Strong encryption + Explicit consent |
| **Secret** | Business critical | API keys, encryption keys | HSM/KMS + Memory wipe |

## Data Handling Matrix

Every feature MUST document its data handling before code is written:

```markdown
## Feature: User Enrollment

| Data Point | Source | Format | Stored Where | Encrypted? | Anonymized? | TTL | Legal Basis |
|------------|--------|--------|-------------|------------|-------------|-----|-------------|
| UUID | Generated | UUID v4 | PostgreSQL | No (not PII) | N/A | Permanent | Contract 6(1)(b) |
| Factor digests | User input | SHA-256 hex | Redis | AES-256-GCM | Salted hash | 24h | Consent 6(1)(a) |
| IP address | req.ip | String | Redis (temporary) | No | Anonymized (/24) | 30d | Legitimate Interest 6(1)(f) |
| Device ID | Client | String | Redis (optional) | No | Salted SHA-256 | 365d | Consent 6(1)(a) |
| Email | User input | Email | PostgreSQL | AES-256-GCM | No | Permanent | Contract 6(1)(b) |

### NOT Collected (Explicit Exclusion)
- Exact geolocation (only country-level for compliance)
- Browsing history
- Contact list
- Behavioral tracking data
```

## Anonymization Rules

| Data Type | Treatment | Method |
|-----------|-----------|--------|
| **IP address** | Anonymize at collection | Keep first 3 octets (203.0.113.0), discard last octet |
| **Device ID** | Hash at collection | `SHA-256(device_id + PRIVACY_APP_SALT + user_uuid)` |
| **Email** | Encrypt at rest | AES-256-GCM with per-user key |
| **User UUID** | Random generation | UUID v4 (not derived from PII) |
| **Wallet address** | Hash for storage | `SHA-256(address + PRIVACY_APP_SALT)` |
| **Phone number** | Encrypt at rest | AES-256-GCM (separate key from email) |

### Implementation

```javascript
const { hashDeviceId, anonymizeIP } = require('../utils/privacyUtils');
const { getPrivacyAppSalt } = require('../config/secrets');

// ✅ CORRECT — Anonymize at collection
const safeIP = anonymizeIP(req.ip);  // NOT req.body.ip
const deviceHash = hashDeviceId(rawDeviceId, userUuid);

// ❌ WRONG — Raw storage
const data = { ip: req.ip, device_id: rawDeviceId };
```

## Data Retention (TTL)

All stored data MUST have a defined TTL. No exceptions.

| Data Type | Default TTL | Configurable | Cleanup Job |
|-----------|-------------|-------------|-------------|
| Session | 15 minutes | SESSION_TTL | Redis expiry |
| Factor digests | 24 hours | — | Redis expiry |
| Auth nonces | 5 minutes | NONCE_TTL | Redis expiry |
| Rate limit counters | 1 hour | — | Redis expiry |
| Audit logs | 90 days | AUDIT_LOG_RETENTION_DAYS | `dataRetentionCleanup.js` |
| Device ID hashes | 365 days | DEVICE_ID_RETENTION_DAYS | `dataRetentionCleanup.js` |
| IP prefixes | 30 days | IP_ADDRESS_RETENTION_DAYS | `dataRetentionCleanup.js` |

```javascript
// ✅ CORRECT — TTL is required
await cacheService.set(`key:${id}`, data, SESSION_TTL);

// ❌ WRONG — GDPR violation
await cacheService.set(`key:${id}`, data);  // No TTL!
```

## User Rights Endpoints

| Right | Endpoint | Regulation |
|-------|----------|------------|
| Access (export) | `GET /v1/user/export` | GDPR Art. 15, CCPA |
| Deletion | `DELETE /v1/user/delete` | GDPR Art. 17, CCPA |
| Correction | `PUT /v1/user/profile` | GDPR Art. 16 |
| Portability | `GET /v1/user/export?format=json` | GDPR Art. 20 |
| Consent withdrawal | `PUT /v1/user/consent` | GDPR Art. 7(3) |

## Logging (Privacy-Safe)

### Logger Rules

```javascript
// ✅ CORRECT — Use structured logger (auto-redacts sensitive fields)
const logger = require('../utils/logger');
logger.info('User action', { userId: userId.slice(0, 8), action: 'login' });

// ❌ WRONG — console.log bypasses PII redaction
console.log('User logged in', userId);  // PII leak!

// ❌ WRONG — Full error object (may leak stack trace)
logger.error('Operation failed:', error);

// ✅ CORRECT — Safe error logging
logger.error('Operation failed:', error.message);
```

### Sensitive Fields (Auto-Redacted)

The logger auto-redacts these keys from logged objects:
- `password`, `secret`, `token`, `key`
- `digest`, `private`, `seed`, `salt`, `iv`, `hash`
- `authorization`, `cookie`, `x-api-key`

### SSRF Logging

```javascript
// ❌ WRONG — Logs user-controlled URL
logger.warn(`SSRF blocked: ${userProvidedUrl}`);

// ✅ CORRECT — Logs parameter name, not value
logger.warn(`SSRF blocked on URL parameter`);
```

## Audit Service Pattern

Centralized audit logging for compliance (GDPR Art. 30) and security monitoring.

### Event Types

```javascript
const EVENT_TYPES = {
    ENROLLMENT_STARTED: 'enrollment.started',
    ENROLLMENT_COMPLETED: 'enrollment.completed',
    ENROLLMENT_FAILED: 'enrollment.failed',
    VERIFICATION_SUCCESS: 'verification.success',
    VERIFICATION_FAILED: 'verification.failed',
    SESSION_CREATED: 'session.created',
    SESSION_EXPIRED: 'session.expired',
    DATA_EXPORT_REQUESTED: 'gdpr.export.requested',
    DATA_EXPORT_COMPLETED: 'gdpr.export.completed',
    DATA_DELETION_REQUESTED: 'gdpr.delete.requested',
    DATA_DELETION_COMPLETED: 'gdpr.delete.completed',
    CONSENT_GRANTED: 'gdpr.consent.granted',
    CONSENT_REVOKED: 'gdpr.consent.revoked',
    ADMIN_ACTION: 'admin.action',
    SECURITY_EVENT: 'security.event'
};
```

### Usage in Routes

```javascript
const auditService = new AuditService(pool);

router.post('/enrollment', async (req, res) => {
    try {
        // ... handle enrollment ...
        await auditService.logEvent({
            eventType: EVENT_TYPES.ENROLLMENT_COMPLETED,
            uuid: req.body.uuid,
            ipAddress: anonymizeIP(req.ip),
            userAgent: req.headers['user-agent'],
            details: { /* event-specific, no PII */ },
            severity: SEVERITY.INFO
        });
        res.status(201).json({ success: true });
    } catch (error) {
        await auditService.logEvent({
            eventType: EVENT_TYPES.ENROLLMENT_FAILED,
            details: { error: safeErrorMessage(error) },
            severity: SEVERITY.ERROR
        }).catch(() => {});  // Non-blocking
        res.status(500).json({ error: 'Failed' });
    }
});
```

### Security Properties

- **Immutable logs** — Write-once, no updates or deletes
- **Parameterized queries** — SQL injection prevention
- **Sensitive data sanitization** — PII auto-redacted
- **Retention policies** — Configurable per event type (GDPR)
