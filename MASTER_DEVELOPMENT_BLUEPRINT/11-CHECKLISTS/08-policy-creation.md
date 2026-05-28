# Policy Creation (Mandatory Before Code)

## The Rule

**No code is written until policies are created and committed.**

The LLM's job during policy creation:
1. Read this file to understand the 4 mandatory policies
2. Present each policy to the user as a guided conversation
3. Ask targeted questions, fill in the template with the user's answers
4. Once all 4 policies are complete → commit them
5. Only then proceed to architecture, patterns, and code

**Why before code:** Policy defines what "correct" means. Without policy, code has no guardrails. With policy, every implementation decision can be validated against the policy. This prevents "we'll figure out security later" — the most expensive mistake in software.

---

## LLM Workflow

```
Phase 1: Discovery            ← already exists
Phase 2: POLICY CREATION      ← NEW — mandatory before anything else
  ├─ 2a: DATA_POLICY          ─ What data, stored where, retention, legal basis
  ├─ 2b: SECURITY_POLICY      ─ Auth, encryption, incident response, rate limits
  ├─ 2c: COMPLIANCE_POLICY    ─ Regulations, deadlines, audit requirements
  └─ 2d: PRIVACY_POLICY       ─ User rights, consent, opt-out, deletion
  └─ Commit all policies
Phase 3: Pattern Matching     ← was Phase 2
Phase 4: Decision Trees       ← was Phase 3
Phase 5: Governance Records   ← was Phase 4 (risk assessment + decision log)
Phase 6: Implementation       ← was Phase 5
Phase 7: Validation           ← was Phase 6
```

---

## Policy 1: DATA_POLICY

### Template

File: `policies/DATA_POLICY.md`

```markdown
# Data Policy

## Data Inventory

| Data Point | Source | Storage Location | Encrypted? | Retention | Legal Basis (GDPR Art. 6) |
|-----------|--------|-----------------|-----------|-----------|--------------------------|
| [field]   | [user/device/third-party] | [database/redis/logs] | [yes/no] | [duration] | [Art. 6 clause] |

## Data Minimization

**What we DO collect:**
- [list fields]
- [justification for each]

**What we do NOT collect (explicit):**
- [list fields we chose not to collect and why]

## Data Flow Diagram

```
[Entry point] → [Processing] → [Storage] → [Deletion/Anonymization]
```

## Data Deletion Policy

- Deletion trigger: [account deletion / retention expiry / user request]
- Deletion method: [hard delete / anonymize / soft delete]
- Maximum retention: [duration]
- Cleanup job: [cron schedule / event trigger]

## Data Breach Response

- Detection: [how do we know data was breached?]
- Notification: [who gets notified, within what timeframe?]
- Containment: [how do we stop the breach?]
- Recovery: [how do we restore data?]
```

### LLM Guiding Questions (Ask These)

```
Let's create your DATA_POLICY. I'll ask you questions and fill in the template.

1. What data does your application handle?
   - User identifiers (email, UUID, username, phone)?
   - Authentication data (passwords, tokens, biometrics)?
   - Payment data (cards, bank accounts, transaction history)?
   - Behavioral data (clicks, patterns, usage)?
   - Device data (IP, fingerprint, OS, location)?

2. For each data point:
   - Where does it get stored? (database, Redis, cache, logs, third-party?)
   - Does it need encryption at rest?
   - How long should we keep it?
   - What legal basis allows us to collect it?
     (GDPR: consent, contract necessity, legal obligation, legitimate interest)

3. What data are you explicitly choosing NOT to collect?
   - (This is as important as what you collect — "data minimization")

4. Who can access this data?
   - Internal team only?
   - Third-party services?
   - Users themselves?

5. How do users request deletion of their data?
   - Account deletion endpoint?
   - Support request?
   - Automated or manual?
```

---

## Policy 2: SECURITY_POLICY

### Template

File: `policies/SECURITY_POLICY.md`

```markdown
# Security Policy

## Authentication Requirements

- Auth method: [JWT / OAuth2 / API keys / custom]
- Token lifetime: access [duration], refresh [duration]
- MFA required: [yes/no]
- Rate limiting: [3-tier escalating / sliding window]

## Encryption Standards

| Layer | Algorithm | Key Size | Key Storage |
|-------|-----------|----------|-------------|
| In transit | TLS 1.3 | - | Certificate authority |
| At rest | AES-256-GCM | 256-bit | KMS / env var |
| Key derivation | PBKDF2 | 256-bit output | Application config |
| Hashing | SHA-256 (salted HMAC) | - | Per-level isolation |

## Input Validation

- Maximum input size: [N] bytes
- All inputs validated at: [API gateway / middleware / handler / all layers]
- SQL injection prevention: [parameterized queries / ORM]
- XSS prevention: [output encoding / CSP headers]

## Incident Response Plan

1. Detection: [automated monitoring / user report / pen test]
2. Triage: [severity levels: critical / high / medium / low]
3. Containment: [isolate affected systems / revoke keys / block IPs]
4. Eradication: [remove root cause / patch]
5. Recovery: [restore from backup / redeploy]
6. Post-mortem: [FAIL-XXX entry within [N] hours]

## Rate Limiting

- Auth endpoints: 3-tier escalating (5→15min, 8→4h, 10→frozen)
- API endpoints: sliding window, [N] req/min per IP
- Global emergency brake: [N] req/sec
```

### LLM Guiding Questions

```
Now let's create your SECURITY_POLICY.

1. How do users authenticate?
   - Passwords? (hash + salt + constant-time compare)
   - API keys? (hash on storage, compare constant-time)
   - JWT? (short-lived access + refresh token rotation)
   - OAuth2? (which providers?)

2. What encryption do you need?
   - In transit: TLS is mandatory for any production service
   - At rest: Do you store anything sensitive that needs DB-level encryption?
   - Application-level: Do you need to encrypt data before storing (like factor digests)?

3. What's your incident response?
   - Who gets paged at 3 AM on a Sunday?
   - How fast do you need to respond to a breach? (SLA)
   - Do you have a security contact / disclosure policy?

4. Rate limiting:
   - What's "normal" usage for your API? (determines thresholds)
   - What's abuse? (determines escalation tiers)
   - Do you need per-user or per-IP or both?
```

---

## Policy 3: COMPLIANCE_POLICY

### Template

File: `policies/COMPLIANCE_POLICY.md`

```markdown
# Compliance Policy

## Applicable Regulations

| Regulation | Applies? | Deadline | Notes |
|-----------|----------|----------|-------|
| GDPR (EU) | [yes/no] | [date] | [territorial scope] |
| CCPA/CPRA (California) | [yes/no] | [date] | [if >$25M revenue or 50K+ users] |
| PIPEDA (Canada) | [yes/no] | [date] | [if Canadian users] |
| LGPD (Brazil) | [yes/no] | [date] | [if Brazilian users] |
| PCI-DSS (Payments) | [yes/no] | [date] | [if handling card data] |
| HIPAA (Health) | [yes/no] | [date] | [if health data] |
| SOC 2 | [yes/no] | [date] | [enterprise customers require it] |
| PSD3/SCA (EU Payments) | [yes/no] | [date] | [if payment authentication] |
| BIPA (Illinois Biometric) | [yes/no] | [date] | [if biometric data + Illinois users] |
| [Other] | [yes/no] | [date] | [notes] |

## Audit Requirements

- Audit log scope: [all auth events / all data mutations / all admin actions]
- Audit log retention: [duration]
- Audit log storage: [append-only / encrypted / immutable]
- Third-party audits: [annual / quarterly / none]
- Penetration testing: [frequency] by [internal / external]

## Data Subject Rights (GDPR)

| Right | How We Fulfill It |
|-------|-------------------|
| Access | [endpoint where user downloads data] |
| Rectification | [endpoint where user corrects data] |
| Erasure | [endpoint where user deletes data] |
| Portability | [download format, timeline] |
| Objection to processing | [opt-out mechanism] |
```

### LLM Guiding Questions

```
Let's create your COMPLIANCE_POLICY.

1. Where do your users live (or will live)?
   - EU → GDPR applies (broadest, sets the baseline)
   - California → additional CCPA requirements
   - Canada → PIPEDA
   - Brazil → LGPD

2. Do you handle payment data?
   - If yes → PCI-DSS (even if PSP handles it, some scope may apply)
   - If you do authentication for payments → PSD3/SCA may apply

3. Do you handle biometric data?
   - If yes, and Illinois users → BIPA (consent + notice + private right of action)
   - If yes, and EU → biometrics are "special category" under GDPR Art. 9

4. Do you need SOC 2?
   - Enterprise customers often require it
   - Start with SOC 2 Type I, then Type II within 12 months

5. Do you need external audits or pen tests?
   - Some regulations require annual pen tests
   - Some require external audit firms
   - At minimum: run your own pen test before launch
```

---

## Policy 4: PRIVACY_POLICY

### Template

File: `policies/PRIVACY_POLICY.md`

```markdown
# Privacy Policy

## Consent Mechanism

- Consent obtained: [at account creation / per-feature / opt-out]
- Consent storage: [where consent records are stored]
- Consent withdrawal: [how user withdraws consent]

## User Rights

- Right to access: [endpoint + SLA]
- Right to deletion: [endpoint + SLA]
- Right to data portability: [format + SLA]
- Right to object: [opt-out mechanism]
- Right to rectification: [endpoint + SLA]

## Data Sharing

| Third Party | Data Shared | Purpose | Legal Basis |
|------------|------------|---------|-------------|
| [name] | [fields] | [reason] | [Art. 6 clause] |

## Data Retention Schedule

| Data Category | Retention | Deletion Method | Cleanup Job |
|--------------|-----------|----------------|-------------|
| [category] | [duration] | [hard delete / anonymize] | [cron / event] |

## User Notification

- Breach notification: [within N hours via email/in-app]
- Policy changes: [how users are informed]
- Contact: [DPO email / support email]
```

### LLM Guiding Questions

```
Let's create your PRIVACY_POLICY.

1. How do you get user consent?
   - Checkbox at signup? (explicit consent)
   - Continued use = consent? (implied — weaker, not sufficient for GDPR)
   - Per-feature consent? (granular, strongest)

2. Can users delete their data?
   - Is there a "delete my account" feature?
   - Are all associated data points deleted or just anonymized?
   - What's the SLA for deletion? (GDPR says "without undue delay" — typically 30 days)

3. Do you share data with third parties?
   - Cloud providers (AWS, GCP, Azure?)
   - Analytics (GA, Mixpanel, Sentry?)
   - Payment processors (Stripe, Adyen?)
   - AI/ML services (OpenAI, Anthropic?)
   - Each of these needs to be documented with what data is shared and why

4. How do you notify users of changes?
   - Email notification for policy changes?
   - In-app banner?
   - "Continued use constitutes acceptance"?
```

---

## Policy Commit Flow

```bash
# After all 4 policies are complete:

mkdir -p policies

# Write each policy file (LLM fills from conversation)
# File: policies/DATA_POLICY.md
# File: policies/SECURITY_POLICY.md
# File: policies/COMPLIANCE_POLICY.md
# File: policies/PRIVACY_POLICY.md

# Commit before any code
git add policies/
git commit -m "policy: initial data, security, compliance, and privacy policies

Co-authored-by: [user] <[user-email]>"
```

---

## Policy Update Rules

| Trigger | Action |
|---------|--------|
| New feature that handles data | Update DATA_POLICY (add data point + justification) |
| New regulation applies (e.g., entering EU market) | Update COMPLIANCE_POLICY (add regulation + deadline) |
| Security incident | Update SECURITY_POLICY (add incident response lessons) |
| New third-party integration | Update PRIVACY_POLICY (add data sharing entry) |
| User deletion mechanism changes | Update PRIVACY_POLICY (update deletion procedure) |
| Rate limit thresholds change | Update SECURITY_POLICY (update rate limit config) |

**Every policy update is committed in the same commit as the code change that triggered it.** Pre-push agent enforces this.

---

## Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Skip policy creation "for speed" | Policy IS speed — it prevents rework. 10 min of policy saves 10 hours of code rewrite. |
| Write policies after code is done | Policies written retroactively are rationalizations, not guardrails. |
| Generic copy-pasted policies | Every template question must be answered specifically for YOUR project. |
| Policies committed once and never updated | Policies live with the code. Every feature commit checks if policy needs updating. |
| Only GDPR (ignore other regulations) | GDPR is the baseline. CCPA, PIPEDA, LGPD, BIPA, SOC 2 each add requirements. |
| Policy says "yes encrypt" but implementation doesn't | Implementation validation checks every policy requirement has corresponding code. |

## Checklist

- [ ] DATA_POLICY created before any code
- [ ] SECURITY_POLICY created before any code
- [ ] COMPLIANCE_POLICY created before any code
- [ ] PRIVACY_POLICY created before any code
- [ ] All 4 policies committed to repo
- [ ] LLM asked all guiding questions for each policy
- [ ] Data inventory complete (every data point documented)
- [ ] Legal basis documented for each stored data point
- [ ] Applicable regulations identified with deadlines
- [ ] Encryption standards match actual implementation requirements
- [ ] Rate limits defined per endpoint type
- [ ] Incident response plan documented
- [ ] User consent mechanism defined
- [ ] Data deletion process defined
