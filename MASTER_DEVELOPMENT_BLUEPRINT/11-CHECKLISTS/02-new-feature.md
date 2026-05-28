# New Feature Checklist

## Before Coding

- [ ] **Read planning.md** — Does this feature align with roadmap?
- [ ] **Read tasks.md** — Is this the current priority?
- [ ] **Run governance** — Type `/build` (7-step workflow)
- [ ] **Review architecture** — Read relevant architecture docs
- [ ] **Review patterns** — Read existing similar features for patterns
- [ ] **Review security** — Security audit for similar features
- [ ] **Review lessons** — Check LESSONS_LEARNED.md for related mistakes
- [ ] **Data Handling Matrix** (if >100 LOC) — All data points documented (see 04-SECURITY/05-compliance.md)
- [ ] **Security Compliance Matrix** (if >100 LOC) — Auth, rate limit, replay, SSRF, audit (see 04-SECURITY/05-compliance.md)
- [ ] **Risk Assessment** (if >100 LOC) — Leak/blast radius, abuse potential, key compromise (see 04-SECURITY/05-compliance.md)

## During Coding

- [ ] **Start from template** — Use router/service templates
- [ ] **Read actual source files** — Verify imports, exports, signatures
- [ ] **Write tests first** — Test-driven development for >50 LOC
- [ ] **Follow security patterns** — Constant-time, memory wipe, CSPRNG
- [ ] **Use abstraction layer** — No direct Redis/DB calls
- [ ] **Add TTL** — Every cache entry needs expiry
- [ ] **Anonymize at collection** — Hash device IDs, anonymize IPs
- [ ] **Use structured logger** — No console.log
- [ ] **Stateless service** — No module-level mutable state
- [ ] **No platform imports in commonMain** (KMP) — Use expect/actual
- [ ] **Add feature flag** — Disabled by default

## After Coding

- [ ] **All tests pass** — Unit, service, integration
- [ ] **Coverage meets threshold** — 80%+ overall, 100% for security paths
- [ ] **Documentation updated** — API docs, dev guides, README
- [ ] **.env.example updated** — Any new env variables
- [ ] **CI/CD workflows updated** — New env vars in all workflow files
- [ ] **Planning updated** — tasks.md timestamped, planning.md % updated
- [ ] **COMPLIANCE.md committed** — Compliance document in docs/05-security/
- [ ] **Pre-push agent passes** — `./scripts/agent @all` exit 0

## After Deploy

- [ ] **Monitor errors** — Check error tracking for new endpoint
- [ ] **Monitor performance** — Latency, error rate, throughput
- [ ] **Review logs** — No PII leaks, proper redaction
- [ ] **Document lessons** — Any surprises? Add to LESSONS_LEARNED.md
