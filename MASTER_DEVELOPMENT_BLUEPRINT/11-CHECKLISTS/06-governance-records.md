# Governance Records

## MANDATORY — Every Project Must Maintain These

These three documents are the project's memory. Without them, you repeat mistakes, forget why decisions were made, and can't prove compliance.

---

## 1. Risk Assessment Matrix

### When to Create
- **Before any feature >100 LOC** — complete a risk assessment
- **At project start** — full security + privacy risk assessment
- **On any compliance change** — GDPR, PSD3, HIPAA, PCI-DSS trigger reassessment

### Template

```
# Risk Assessment: [FEATURE/SYSTEM NAME]
# Date: YYYY-MM-DD
# Assessor: [Name]
# Version: 1.0

## 1. Scope
[What is being assessed? One paragraph max]

## 2. Data Inventory
| Data Point | Source | Stored? | Encrypted? | Retention | Legal Basis |
|-----------|--------|---------|------------|-----------|-------------|
| [field]   | [how it enters] | [where] | [AES-256-GCM / none] | [TTL / permanent] | [GDPR Art. 6 basis] |
| [field]   | [how it enters] | [where] | [AES-256-GCM / none] | [TTL / permanent] | [GDPR Art. 6 basis] |

## 3. Threat Scenarios
| Scenario | Likelihood | Impact | Risk Level | Mitigation |
|----------|-----------|--------|------------|------------|
| Data breach via XSS | Medium | Critical | HIGH | Input sanitization, CSP headers |
| SSRF to internal services | Low | Critical | MEDIUM | URL validation, IP allowlist |
| Timing attack on auth | Low | High | MEDIUM | Constant-time comparison |
| Rate limit bypass | Medium | Medium | MEDIUM | Sliding window + cooldown escalation |
| Replay attack | Low | High | MEDIUM | Nonce + timestamp validation |
| PII leakage in logs | High | High | HIGH | Structured logger, no console.log |
| Dependency vulnerability | Medium | Critical | HIGH | Weekly audit, `npm audit` in CI |

### Risk Levels
| Level | Action Required |
|-------|----------------|
| **LOW** | Accept. Document in this matrix. |
| **MEDIUM** | Mitigate before release. Document mitigation. |
| **HIGH** | Blocking — do not proceed without fix. Must be reviewed by second person. |
| **CRITICAL** | Immediate stop-work. Requires security team sign-off and written exception. |

## 4. Threat: [Name of specific threat]
- **Description**: [What could happen]
- **Attack vector**: [How it would be exploited]
- **Blast radius**: [What data/systems are affected]
- **Likelihood**: [Low/Medium/High — with reasoning]
- **Impact**: [Low/Medium/High/Critical — with reasoning]
- **Risk Level**: [Calculated from likelihood x impact]
- **Mitigation**: [How we prevent or detect this]
- **Contingency**: [What we do if it happens anyway]
- **Status**: [Open / Mitigated / Accepted / Transferred]
- **Owner**: [Who is responsible]

## 5. Reassessment Trigger
- [ ] Code change to this feature
- [ ] Dependency version change
- [ ] New compliance requirement
- [ ] Security incident involving related systems
- [ ] Quarterly review (if not triggered otherwise)
```

### Example

```
# Risk Assessment: Biometric Authentication Endpoint
# Date: 2026-05-27

## Data Inventory
| Data | Source | Stored | Encrypted | Retention | Legal Basis |
|------|--------|--------|-----------|-----------|-------------|
| Fingerprint hash | Device sensor | Redis (hashed) | Layer 1 PBKDF2 + Layer 2 KMS | 24h TTL | GDPR Art. 6(1)(f) legitimate interest |
| Device ID | Client | Redis (salted hash) | N/A (already irreversible) | 24h TTL | GDPR Art. 6(1)(f) |
| IP address | req.ip | Redis (anonymized) | N/A (last octet zeroed) | 24h TTL | GDPR Art. 6(1)(f) |

## Top Threat
- **Scenario**: BIPA violation (Illinois Biometric Information Privacy Act)
- **Likelihood**: Medium (US-based users)
- **Impact**: Critical ($5,000/violation, class action exposure)
- **Risk Level**: HIGH
- **Mitigation**: BIPA jurisdiction check → user must consent before biometric enrollment
- **Status**: Mitigated
- **Owner**: Security Team
```

### Zero-Approach Risk Table

When you have zero data about a threat, use this structured reasoning:

```
| Concern | What We Know | What We Don't Know | Decision | Revisit Condition |
|---------|-------------|-------------------|----------|-------------------|
| [concern] | [facts] | [gaps] | [proceed/mitigate/block] | [what would change this] |
```

---

## 2. Decision Log

### When to Log
- Every architectural decision (why monolith vs microservices?)
- Every technology choice (why PostgreSQL over MySQL?)
- Every security trade-off (why not constant-time here?)
- Every compliance decision (why we don't need BIPA consent)

### Template

```
# Decision Log

## [DECISION-001] Title: [Brief decision name]
- **Date**: YYYY-MM-DD HH:MM UTC
- **Author**: [Name]
- **Status**: [Proposed / Accepted / Deprecated / Rejected]

### Context
[What prompted this decision? What problem are we solving?]

### Options Considered
| Option | Pros | Cons | Effort |
|--------|------|------|--------|
| Option A | [pros] | [cons] | [effort estimate] |
| Option B | [pros] | [cons] | [effort estimate] |
| Option C | [pros] | [cons] | [effort estimate] |

### Decision
**Chosen**: Option A

**Rationale**: [Why this option over others. Include trade-offs accepted.]

**What we explicitly decided against**:
- Option B rejected because [reason]
- Option C rejected because [reason]

### Consequences
- **Positive**: [What this enables]
- **Negative**: [What this prevents or makes harder]
- **Risk**: [Accepted risks with this choice]

### Compliance Check
- [ ] GDPR impact assessed
- [ ] Security review completed
- [ ] Performance implications understood
- [ ] Migration path documented (if reversing this decision)

### Related Decisions
- [DECISION-002] — [linked decision]
```

### Example

```
## [DECISION-001] Title: Cache Provider Selection
- **Date**: 2026-05-27 14:30 UTC
- **Author**: rastafalso
- **Status**: Accepted

### Context
Need a caching layer for auth factor digests. 24h TTL. Must survive server restarts.

### Options
| Option | Pros | Cons | Effort |
|--------|------|------|--------|
| Redis | Battle-tested, TTL built-in, fast | Additional infra to manage | 2 days setup |
| In-memory Map | Zero infra, fast | Lost on restart, no multi-server | 2 hours |
| PostgreSQL | Already have it, persistent | Slower, higher latency | 1 day |

### Decision
**Chosen**: Redis with in-memory fallback for local dev (provider abstraction)

**Rationale**: Redis TTL maps exactly to our 24h digest expiry. Provider abstraction lets devs use in-memory locally.
**Rejected**: In-memory (lost on restart breaks auth continuity). PostgreSQL (latency too high for auth flow).

### Consequences
- **Positive**: Fast auth verification, clear TTL semantics
- **Negative**: Redis is another service to operate
- **Risk**: If Redis goes down, falls back to PostgreSQL (HybridCacheService)
```

---

## 3. Failure / Incident Log

### When to Log
- Any production incident (outage, data leak, auth failure spike)
- Any bug that reached production
- Any failed experiment (approach that didn't work)
- Any security vulnerability found (even if no exploit)

### Template

```
# Failure / Incident Log

## [FAIL-001] Title: [Brief failure name]
- **Date**: YYYY-MM-DD HH:MM UTC
- **Detected by**: [Monitoring / User report / Audit / Developer]
- **Severity**: [Critical / High / Medium / Low]
- **Status**: [Open / Investigating / Fixed / Resolved / Won't Fix]

### Summary
[What happened? One paragraph]

### Impact
- **Users affected**: [number or description]
- **Data affected**: [what data, if any, was exposed/lost]
- **Downtime**: [duration]
- **Financial impact**: [if measurable]

### Root Cause
[Why did it happen? Be honest — "human error" is not a root cause]

### Timeline
| Time (UTC) | Event |
|------------|-------|
| HH:MM | [First sign of issue] |
| HH:MM | [Alert triggered] |
| HH:MM | [Investigation started] |
| HH:MM | [Root cause identified] |
| HH:MM | [Fix deployed] |
| HH:MM | [All clear] |

### Detection
[How was this found? Could it have been found earlier? What monitoring gap exists?]

### Fix
[What was done to resolve it? Include PR/commit links]

### Prevention
[What changes prevent recurrence? Must be specific actions, not intentions]

### Lessons
[What did we learn? Must be actionable]

### Action Items
| # | Action | Owner | Due Date | Status |
|---|--------|-------|----------|--------|
| 1 | [action] | [owner] | [date] | [Open/Done] |
| 2 | [action] | [owner] | [date] | [Open/Done] |

### Related
- [DECISION-XXX] — [decision that relates to this failure]
- [LESSONS_LEARNED.md entry]
```

### Example

```
## [FAIL-001] Title: Non-Constant-Time Comparison in Auth Endpoint
- **Date**: 2026-05-27 09:15 UTC
- **Detected by**: Security audit (verify-patterns.sh @compliance)
- **Severity**: High
- **Status**: Fixed

### Summary
sandboxRouter.js `/seed-accounts` compared admin API key with `adminKey !== expectedKey`.
This leaks timing information — attacker can brute-force key byte-by-byte.

### Root Cause
Developer used `!==` instead of `constantTimeCompare()`. Common mistake —
JavaScript `===`/`!==` looks correct but is not constant-time.

### Detection
Found by The Compliance Officer agent (verify-compliance.sh) during pre-push check.
Not caught earlier because: no automated check for this specific pattern existed.

### Fix
Replaced `!==` with `!constantTimeCompare(adminKey, expectedKey)`.
PR: #1234

### Prevention
1. Added grep check to verify-compliance.sh: `process.env` compared with `===` or `!==`
2. Added LESSONS_LEARNED entry (Lesson 104)
3. Team training: "if one side of comparison could be user-controlled, use constant-time"

### Action Items
| # | Action | Owner | Due | Status |
|---|--------|-------|-----|--------|
| 1 | Add `=== process.env` grep to verify-compliance.sh | rastafalso | 2026-06-01 | Open |
| 2 | Review all remaining route files for similar pattern | rastafalso | 2026-06-07 | Open |
```

---

## Maintenance Rules

| Document | Update Trigger | Owner |
|----------|---------------|-------|
| Risk Assessment | Every new feature, every compliance change | Feature author + security reviewer |
| Decision Log | Every architecture/tech/trade-off decision | Person making the decision |
| Failure Log | Every incident, every production bug | On-call engineer |

**All three are checked into git in the same commit as the related code change.**
**No exception for "we'll add it later."** The git commit is the timestamp.

---

## 4. Session Context (LLM Memory)

### When to Create
- **At session start** — if no SESSION_CONTEXT.md exists, create one
- **On every phase transition** — update the current phase and add recent decisions

### Why

LLMs don't remember between conversations. If you start a new session, the LLM should not ask questions already answered. The session context file is the LLM's memory — it tells a new session what happened in previous ones.

### Template

```
# SESSION_CONTEXT.md
# Started: YYYY-MM-DD HH:MM UTC
# Project: [name]

## Current Phase: [1-Discovery / 2-Policies / 3-Patterns / 4-Decisions / 5-Risk+Approvals / 6-Anti-Patterns / 7-Code / 8-Validation]

## Completed Phases
- [ ] Phase 1 — Discovery (date: YYYY-MM-DD)
- [ ] Phase 2 — Policies (date: YYYY-MM-DD)
- [ ] Phase 3 — Pattern Matching (date: YYYY-MM-DD)
- [ ] Phase 4 — Decisions (date: YYYY-MM-DD)
- [ ] Phase 5 — Risk + Approvals (date: YYYY-MM-DD)
- [ ] Phase 6 — Anti-Patterns (date: YYYY-MM-DD)
- [ ] Phase 7 — Code (date: YYYY-MM-DD)
- [ ] Phase 8 — Validation (date: YYYY-MM-DD)

## Project Profile
- Type: [web API / mobile / CLI / library / full-stack]
- Language: [Node.js / Python / Go / etc.]
- Client: [who it's for]
- Purpose: [what it solves]
- Scale: [hobby / startup / growth / enterprise]

## Key Decisions (from DECISION-XXX entries)
- DECISION-001: [summary]
- DECISION-002: [summary]

## Open Questions
- [ ] [question to circle back to]

## Current Blockers
- [ ] [what's blocking progress]

## Recent Activity
- [bullet list of what happened this session]
```

### Usage Rules

1. **Always check for this file at session start.** If it exists, read it before responding.
2. **Never ask questions that are already answered in the context.** If the project profile says "Scale: hobby", don't ask "how many users do you expect?"
3. **Update on every phase transition.** When moving from Phase 2 to 3, write: "Completed Phase 2 (Policies) on 2026-05-28."
4. **Update when user corrects you.** If the user says "actually we chose PostgreSQL" — update SESSION_CONTEXT.md immediately.
5. **Commit with code.** The context file goes in the same commit as the related work.

### Session Resumption

When starting a new conversation and SESSION_CONTEXT.md exists:

```
"I see we completed Phases 1-3 in our last session.
Your project is a Node.js API for subscription management.
You chose PostgreSQL + Redis, policies are committed.
In Phase 4 we were deciding between REST and GraphQL.
Shall we continue from there?"
```

Never say: "Let's start from the beginning. What are you building?"

---

## Integration With LLM Workflow

When using the blueprint with an LLM, the following are MANDATORY:

1. **Before generating code**: LLM must complete a Risk Assessment for the feature
2. **During architecture discussion**: LLM must log the decision in Decision Log format
3. **After any bug/incident**: LLM must create a Failure Log entry
4. **Every commit**: LLM includes `Co-authored-by:` with the user's git info
5. **Session context maintained**: SESSION_CONTEXT.md updated at every phase transition
