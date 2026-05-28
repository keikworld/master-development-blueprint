# Security Lessons Learned

## Why This Matters

Of the 100+ lessons in this codebase, roughly 40% are security-related. Security bugs are the most expensive to fix (post-deployment vs pre-deployment: 100x+ cost ratio). Every lesson here came from real production incidents or audits.

## Lesson 1: SSRF Protection Must Be Symmetric Across CRUD

**What went wrong**: A `POST /webhooks` (create) route had no SSRF validation on the URL field. The `PUT /:id` (update) route had `validateURL()` and was safe. An attacker could create a webhook pointing to an internal service like `http://169.254.169.254/latest/meta-data/` (AWS metadata endpoint).

**Pattern**: When auditing SSRF protection, check ALL CRUD routes for a resource — not just the most obvious one.

**Checklist**:
- [ ] Create (POST) route validates URL fields
- [ ] Update (PUT/PATCH) route validates URL fields
- [ ] Read (GET) route validates URL params that trigger DNS lookups
- [ ] Delete (DELETE) route validates URL params if applicable

**How to grep**:
```bash
grep -n "router\.\(get\|post\|put\|delete\|patch\)" <file>
# Review every result for middleware gaps
```

## Lesson 2: Timing Attacks — Always Constant-Time for Secrets

**What went wrong**: Admin API key comparison used `adminKey !== expectedKey`. JavaScript string comparison short-circuits on first mismatched byte, leaking timing information. An attacker can brute-force the key character-by-character.

**Pattern**: Any comparison involving a secret must use constant-time. The rule: if one side could be user-controlled, use constant-time.

```javascript
// ❌ Wrong — timing leak
if (adminKey !== process.env.ADMIN_API_KEY) { /* fail */ }

// ✅ Correct — constant-time
const { constantTimeCompare } = require('../utils/constantTimeCompare');
if (!constantTimeCompare(adminKey, expectedKey)) { /* fail */ }
```

```kotlin
// Kotlin
if (!constantTimeEquals(expected, actual)) { /* fail */ }
```

**Checklist**:
- [ ] API key comparisons
- [ ] Token comparisons (JWT, session tokens)
- [ ] Password/PIN comparisons
- [ ] HMAC/Signature comparisons
- [ ] Digest comparisons (auth factor verification)

**Search pattern**:
```bash
grep -rn "=== process.env\|!== process.env\|=== secret\|=== key\|=== token" --include="*.js" --include="*.kt"
```

## Lesson 3: Middleware Coverage — Grep All Routes

**What went wrong**: `namesRouter.js` applied `strictSSRFProtection` to three GET routes but not to `POST /validate`. The POST route accepts user input that triggers DNS lookups. The POST route was added later and didn't inherit protection because it was a separate `router.post()` call.

**Pattern**: When adding security middleware to a router, grep for ALL `router.{method}` calls and verify each one that accepts external input. Don't stop at the first few routes.

**How to apply**:
```bash
# After fixing one route, audit the entire file
grep -n "router\.\(get\|post\|put\|delete\|patch\)" <file> | grep -v "middleware.ref"
# Review every result for coverage gaps
```

## Lesson 4: Audit Tool False Positives — Verify Before Fixing

**What went wrong**: An automated audit agent flagged the email regex as "broken" and `limit/offset` params as "unvalidated". Both were actually correct (23% false positive rate). Had the team implemented the "fixes", they would have broken valid emails and added redundant code.

**Pattern**: Two-phase audit: (1) generate findings list, (2) verify each against actual source before committing to fixes. Read the file — don't trust the tool.

## Lesson 5: Rate Limiting — Three Escalation Levels

**What went wrong**: Missing rate limiting on service endpoints allowed brute-force attacks on authentication.

**Pattern**: Three-tier escalation with increasing cooldowns:

```javascript
const COOLDOWN_15M = 5;    // 5 attempts → 15 min cooldown
const COOLDOWN_4H  = 8;    // 8 attempts → 4 hour cooldown
const FROZEN       = 10;   // 10 attempts → frozen until admin reset
```

## Lesson 6: Error Messages — Never Leak Details

**What went wrong**: `res.json({ error: error.message })` exposed stack traces and internal state to clients.

**Pattern**: Always use a safe error wrapper:

```javascript
const { safeErrorMessage } = require('../utils/safeErrorResponse');
// Never: res.status(500).json({ error: error.message })
res.status(500).json({ error: safeErrorMessage(error, 'Operation failed') });
```

## Lesson 7: Redis — Always Set TTL

**What went wrong**: `redis.set(key, value)` without expiry creates permanent storage — GDPR violation (no retention limit), and memory leak.

**Pattern**: Every `set()` MUST have a TTL. Use `setEx()`:

```javascript
// ❌ Wrong — no TTL
await redis.set(key, value);

// ✅ Correct
await redis.setEx(key, TTL_SECONDS, value);
```

If the data genuinely needs no expiry (rate limit configs), use a named constant:
```javascript
const NO_EXPIRY = 0; // Explicitly opt out
await redis.setEx(key, NO_EXPIRY, value);
```

## Lesson 8: Client-Supplied IPs Are Forbidden

**What went wrong**: Endpoint accepted `req.body.ip` as a client IP. Attacker could spoof their IP to bypass geo-restrictions or rate limits.

**Pattern**: Always use `req.ip` (from the TCP connection or `X-Forwarded-For` with `trust proxy`). Never accept IP addresses from request body.

```javascript
// ❌ Wrong — attacker controls this
const clientIp = req.body.ip;

// ✅ Correct — from connection
app.set('trust proxy', 1);
const clientIp = req.ip;

// Always anonymize for storage
const { anonymizeIP } = require('../utils/privacyUtils');
const safeIp = anonymizeIP(req.ip);
```

## Lesson 9: console.log Is a PII Leak Vector

**What went wrong**: `console.log(userInput)` accidentally logged raw biometric data, voice recordings, or PII to stdout. No way to redact after the fact.

**Pattern**: Use structured logging with automatic PII redaction:

```javascript
// ❌ Wrong
console.log(`Processing user ${email}`);

// ✅ Correct
const logger = require('../utils/logger');
logger.info('Processing user', { userId: hashedId, context: 'enrollment' });
```

## Lesson 10: Implementation Checklist

For every new feature or endpoint (>100 LOC), run this checklist:

### Data Handling
- [ ] What data enters? (fields, source, format)
- [ ] What is stored? (encrypted?, TTL?, anonymized?)
- [ ] What leaves the system? (minimized?, to whom?)
- [ ] What is explicitly NOT collected? (data minimization)

### Security Gates
- [ ] Auth method (requireAuth, requireUUIDMatch, optionalAuth)
- [ ] Rate limiting (three-tier escalation configured?)
- [ ] Replay protection (nonce + timestamp validation?)
- [ ] SSRF protection (URL input validated?)
- [ ] Error messages sanitized (no error.message leak?)
- [ ] Audit logging (structured, no PII)

### Privacy
- [ ] IP addresses anonymized via `anonymizeIP()`
- [ ] Device IDs hashed via `hashDeviceId()`
- [ ] All `console.log` replaced with structured `logger`
- [ ] Redis keys have TTL set

### Constant-Time
- [ ] Secret comparisons use `constantTimeCompare()`
- [ ] Digest comparisons use `ConstantTime.equals()`
- [ ] Memory wiped after use (`finally { array.fill(0) }`)
