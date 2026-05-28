# Engineering Philosophy & Principles

## Core Philosophy

> **"Build as if the NSA is reviewing your code, the EU is fining non-compliance, and your startup depends on pivoting in 2 weeks."**

This blueprint treats engineering as a **discipline**, not an art. Every pattern exists because a real incident proved it necessary. Every rule has a root cause.

## The 10 Principles

### Principle 1: Security is the Architecture

Security is not a layer, a middleware, or a review step. It is the architecture itself.

```javascript
// ❌ Security as an afterthought — add JWT middleware later
app.post('/api/data', handler);

// ✅ Security as architecture — auth, rate limit, replay protection at mount
const authMw = require('./middleware/auth');
const rateLimit = require('./middleware/rateLimit')(redis);
const replayProtection = require('./middleware/replayProtection')(redis);

app.post('/api/data', authMw, rateLimit, replayProtection, handler);
```

**Applied to:** Every route, every data point, every comparison.

### Principle 2: Compliance is Design, Not Review

A compliance matrix is not something you fill out after coding. It is the spec from which you code.

**Process:** Data Matrix → Legal Basis → Security Controls → Risk Assessment → Code

**Reference:** `04-SECURITY/05-compliance.md`, `03-ARCHITECTURE/05-provider-abstraction.md`

### Principle 3: Everything Has a TTL

If data doesn't have an expiration, it's a liability. This applies to:
- Cache entries (Redis TTL)
- Sessions (absolute + sliding expiry)
- Audit logs (90-day retention)
- API tokens (expiration claims)
- Feature flags (remove after adoption)

```javascript
// ❌ GDPR violation — no expiration
await redis.set(`session:${id}`, data);

// ✅ Compliant — explicit TTL
await redis.setEx(`session:${id}`, SESSION_TTL_SECONDS, data);
```

### Principle 4: Constant-Time or Nothing

Any comparison involving secrets, digests, tokens, or keys must be constant-time. Early returns on byte mismatches create timing oracles.

```javascript
// ❌ Timing attack vulnerability
if (userInput !== storedSecret) return reject();

// ✅ Secure — constant-time comparison
if (!constantTimeCompare(userInput, storedSecret)) return reject();
```

**Reference:** `04-SECURITY/03-cryptography.md`, `10-LESSONS_LEARNED/02-security/lesson-26.md`

### Principle 5: Never Trust Memory

Sensitive data must be wiped after use. `Buffer.fill(0)`, `array.fill(0)`, `wipeBuffer()` in finally blocks.

```kotlin
fun processSecret(secret: ByteArray): Result {
    val derived = deriveKey(secret)
    return try {
        useKey(derived)
    } finally {
        secret.fill(0)
        derived.fill(0)
    }
}
```

### Principle 6: Module Boundaries are Contracts

A module's public API is a contract. Breaking it requires:
1. Version bump
2. Migration path
3. Deprecation period

**Dependency rules:**
```
✅ app → sdk (uses)
✅ enrollment → sdk (uses)
✅ merchant → sdk (uses)
❌ merchant ↔ enrollment (FORBIDDEN — circular)
```

### Principle 7: Provider Abstraction for Everything

Every infrastructure dependency must be swappable without code changes.

```javascript
// ❌ Tight coupling to Redis
const data = await redisClient.get(key);

// ✅ Provider-agnostic — switch Redis→KeyDB→Memcached with env var
const cache = req.app.locals.cacheService;
const data = await cache.get(key);
```

**Reference:** `03-ARCHITECTURE/05-provider-abstraction.md`

### Principle 8: Automate Every Gate

If a check can be automated, it MUST be automated. Human review is for things that require judgment, not for things that can be scripted.

**Automation layers:**
1. **Startup validator** — Checks env config at boot (non-blocking warnings)
2. **Pre-commit hooks** — Fast checks (lint, format, secret scan)
3. **Pre-push agent** — Full gate suite (56 automated checks)
4. **CI/CD pipeline** — Tests, compilation, dependency scanning
5. **Scheduled jobs** — Dependency vulnerability scans, retention cleanup

### Principle 9: Every Incident Becomes a Lesson

When something breaks:
1. Fix it (production first)
2. Write the automated check that would have caught it
3. Add the lesson to the blueprint
4. Update the relevant template

**This creates a ratchet:** The system only gets better over time. Mistakes never repeat.

### Principle 10: LLM Agents Need Structure

AI coding agents are powerful but context-blind. They need:
- A root-level context file (CLAUDE.md pattern) with rules, commands, and references
- Verified import tables (not assumptions based on training data)
- Clear "forbidden" lists
- Step-by-step workflows for common tasks

```
project-root/
  CLAUDE.md        # Context for Claude Code (full)
  gemini.md        # Mirror for Gemini (full)
  .antigravity.md  # Mirror for Antigravity (full)
  AGENTS.md        # Tool-agnostic quick reference for ANY LLM
```

**Reference:** `09-AUTOMATION_AGENTS/01-llm-integration.md`

## Decision Framework

When making any engineering decision, use this flow:

```
1. Does the blueprint already cover this?
   ├─ Yes → Follow the pattern. Do not deviate without documented justification.
   └─ No → Continue.

2. What are the options? (research phase)
   ├─ List 3-5 options with pros/cons
   ├─ Search for real-world usage and incidents
   └─ Check if options violate any existing principles

3. Which option best serves the 10 principles?
   ├─ Security wins over convenience
   ├─ Compliance wins over speed
   ├─ Automation wins over manual process
   └─ Simplicity wins over cleverness

4. Document the decision.
   ├─ What was chosen
   ├─ Why (which pros/cons were decisive)
   ├─ What was rejected (and why)
   └─ Add to tech comparison matrix

5. Update the blueprint.
   ├─ If this creates a new pattern → add to relevant section
   ├─ If this modifies a pattern → update with rationale
   └─ If this is project-specific → add to appendix
```
