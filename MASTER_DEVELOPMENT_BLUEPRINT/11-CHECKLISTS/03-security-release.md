# Security Release Checklist

## Pre-Release

### Code Review

- [ ] All constant-time comparisons verified (use canonical `ConstantTime.equals()`)
- [ ] All memory wiping verified (Buffer.fill(0) in finally blocks)
- [ ] All CSPRNG usage (no Math.random() in security contexts)
- [ ] No console.log in any backend or SDK code
- [ ] No hardcoded secrets
- [ ] No platform imports in commonMain (KMP)
- [ ] All Redis/TTL — every set() has expiry
- [ ] All data anonymized at collection point
- [ ] All error responses stripped of internal details
- [ ] CORS configuration locked down (no wildcard in production)

### Audit

- [ ] **Dependency scan** — `npm audit`, OWASP DC, Trivy — CRITICAL fixed, HIGH assessed
- [ ] **OWASP Top 10 review** — Manual review of all 10 categories
- [ ] **SSRF test** — Block internal network access via URL params
- [ ] **Replay test** — Nonce + timestamp enforced on all state-changing routes
- [ ] **IDOR test** — Ownership check on all resource-accessing endpoints
- [ ] **Rate limit test** — Sliding window enforced, lockout on abuse
- [ ] **Timing attack test** — Constant-time verification measured
- [ ] **Race condition test** — Concurrent access to critical resources

### Compliance

- [ ] **GDPR** — Data minimization, TTL, consent, right to erasure
- [ ] **CCPA** — Right to know, right to delete
- [ ] **PIPEDA** — Meaningful consent, limiting collection
- [ ] **BIPA** — Biometric consent + jurisdiction check (if biometrics)
- [ ] **PSD3/SCA** — 2+ factor authentication (if payment)
- [ ] **Data handling matrix** — Complete for all features
- [ ] **DPIA** — Data Protection Impact Assessment complete

### Documentation

- [ ] **Security audit document** — Findings, fixes, verification
- [ ] **Pentest report** — All scenarios tested, results documented
- [ ] **Compliance documents** — Per-feature compliance docs
- [ ] **Incident response runbook** — What to do when breach detected
- [ ] **env.example** — All env vars documented with descriptions
- [ ] **CHANGELOG** — All security fixes listed

## Release Day

- [ ] Tag version (`git tag v2.0.0`)
- [ ] Docker image built and scanned
- [ ] Env vars propagated to all environments
- [ ] Database migrations run (if schema changes)
- [ ] Feature flags verified (new features disabled by default)
- [ ] Monitoring alerts configured for security events
- [ ] On-call engineer briefed on changes

## Post-Release

- [ ] Monitor for 72 hours (GDPR notification window)
- [ ] Check audit logs for anomalies
- [ ] Review error tracking for unexpected failures
- [ ] Document lessons learned
- [ ] Update CLAUDE.md if new patterns introduced
