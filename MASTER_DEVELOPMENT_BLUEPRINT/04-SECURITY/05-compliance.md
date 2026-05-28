# Compliance Framework

## Compliance by Design

**Rule:** Compliance is the architecture, not a review step. Every feature >100 LOC must have a compliance matrix BEFORE code is written.

### The Compliance Workflow

```
1. Define data points (what data enters, is stored, leaves)
2. Assign legal basis (GDPR Art. 6 for each)
3. Document security controls (auth, rate limit, replay protection)
4. Risk assessment (what if this leaks? what if this is abused?)
5. Write compliance document → commit WITH feature code
```

---

## Regulatory Coverage

| Regulation | Scope | Requirements | When It Applies |
|-----------|-------|-------------|-----------------|
| **GDPR** | EU/UK users | Consent, data minimization, right to erasure, 72h breach notification | Any EU user data |
| **CCPA** | California residents | Right to know, right to delete, opt-out of sale | California users |
| **PIPEDA** | Canadian users | Meaningful consent, limiting collection, safeguards | Canadian users |
| **LGPD** | Brazilian users | Similar to GDPR, consent, data processing bases | Brazilian users |
| **PSD3/SCA** | EU payments | Strong customer authentication (2+ factors) | Payment authentication |
| **BIPA** | Illinois biometrics | Written consent, retention limits, private right of action | Biometric data (Illinois) |
| **PCI DSS** | Payment data | Encrypt cardholder data, access control, logging | If handling card data |
| **SOC 2** | Service organizations | Security, availability, processing integrity | Enterprise contracts |
| **ISO 27001** | Information security | ISMS, risk assessment, controls framework | Certification |

---

## Data Protection Impact Assessment (DPIA)

Required when processing is likely to result in high risk. Include:

1. **Systematic description** — Nature, scope, context, purposes
2. **Necessity and proportionality** — Is there a less intrusive way?
3. **Risk assessment** — Likelihood and severity of harm
4. **Risk mitigation** — Technical and organizational measures

---

## Legal Basis Mapping (GDPR Art. 6)

| Legal Basis | When to Use | Example |
|-------------|-------------|---------|
| **Consent (6(1)(a))** | User chooses to provide data | Biometric data, marketing |
| **Contract (6(1)(b))** | Data needed to deliver service | Email for account, payment info |
| **Legal Obligation (6(1)(c))** | Required by law | Anti-fraud records, AML |
| **Legitimate Interest (6(1)(f))** | Balanced against user rights | Fraud prevention, network security |

### Biometric Data (GDPR Art. 9)

Biometric data requires:
1. **Explicit consent** (not just implied)
2. **Necessity** — Must be necessary for the service
3. **Proportionality** — Least intrusive method
4. **Jurisdiction check** — BIPA for Illinois users

---

## Compliance Documentation

### Per-Feature Compliance Document

Every feature creates a compliance document at:
```
documentation/05-security/[FEATURE_NAME]_COMPLIANCE.md
```

Template:
```markdown
# [Feature Name] — Compliance Document

## Data Handling Matrix

| Data Point | Source | Format | Storage | Encryption | Anonymization | TTL | Legal Basis |
|------------|--------|--------|---------|------------|---------------|-----|-------------|

## Security Controls Matrix

| Endpoint | Auth | Rate Limit | Replay | SSRF | Audit | Sanitization |
|----------|------|------------|--------|------|-------|--------------|

## Risk Assessment

- What if data leaks? (blast radius, regulatory fines)
- What if endpoint is abused? (rate limit, auth bypass)
- What if secret/key is compromised? (rotation plan, revocation)

## Regulatory Matrix

| Data Point | GDPR | BIPA | CCPA | PIPEDA | LGPD |
|------------|------|------|------|--------|------|
```

---

## Compliance Enforcement (Automated)

### Pre-Push Agent Checks

| Check ID | What It Checks | Blocks Push? |
|----------|---------------|-------------|
| COMP-01 | `console.log` in backend code (must use logger) | ✅ Yes |
| COMP-02 | Unsalted SHA-256 hashes (missing PRIVACY_APP_SALT) | ✅ Yes |
| COMP-03 | Raw IP addresses in logs | ✅ Yes |
| COMP-04 | Redis `.set()` without TTL | ✅ Yes |
| COMP-05 | Private DB pool creation (use abstraction) | ✅ Yes |
| COMP-06 | Module-level mutable state (Rule 18) | ✅ Yes |
| COMP-07 | BIPA compliance (biometric + jurisdiction check) | ✅ Yes |
| COMP-08 | `Math.random()` usage (must be CSPRNG) | ✅ Yes |
| COMP-09 | Hardcoded secrets | ✅ Yes |
| COMP-10 | Permission leaks in error responses | ✅ Yes |

### Layer 1: Startup Validator

Runs at server boot, checks:
- Required env vars are set
- PRIVACY_APP_SALT is strong (>= 32 bytes)
- Production env has safe LOG_LEVEL
- Rate limits are configured

### Layer 2: Pre-Push Agent

Runs before every git push, checks all COMP-* items.

### Layer 3: CI Audit

Runs in CI pipeline, same checks + dependency vulnerability scanning.

---

## Incident Response (GDPR Art. 33)

### 72-Hour Notification

If a personal data breach occurs:

```
T+0:  Detect and contain
T+1:  Assess risk (likely to result in risk to rights?)
T+2:  Notify supervisory authority (if risk confirmed)
T+3:  Notify affected data subjects (if high risk)
T+7:  Full incident report
T+30: Remediation complete
```

### Breach Response Checklist

- [ ] Contain: Revoke compromised keys, block affected accounts
- [ ] Assess: What data was exposed? How many users affected?
- [ ] Notify: DPA within 72 hours (if risk to rights)
- [ ] Document: Root cause, remediation, lessons learned
- [ ] Patch: Fix the vulnerability, add automated check
- [ ] Lessons: Add lesson to blueprint (prevent recurrence)
