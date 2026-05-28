# New Project Checklist

## Phase 1: Foundation (First 48 Hours)

### Day 1: Setup

- [ ] **Define the problem** — What specifically does this project solve? Who is it for?
- [ ] **Choose tech stack** — Use technology selection matrix (02-PROJECT_SETUP/02-technology-selection.md)
- [ ] **Initialize repository** — Create monorepo structure (02-PROJECT_SETUP/03-repository-structure.md)
- [ ] **Setup env files** — `.env.example`, `.env.development`, `.env.production`
- [ ] **Configure linter** — ESLint, Prettier, Detekt, KtLint
- [ ] **Configure testing** — Mocha/Chai, JUnit, coverage thresholds
- [ ] **Setup CI/CD** — First pipeline (lint → test → build)
- [ ] **Write CLAUDE.md** — Build commands, project overview, security patterns
- [ ] **Install pre-push hooks** — `ln -sf ../../scripts/pre-push-agent.sh .git/hooks/pre-push`
- [ ] **Create planning files** — `docs/internal/planning.md`, `docs/internal/tasks.md`
- [ ] **Set up Secrets** — PRIVACY_APP_SALT, JWT secret, KMS keys

### Day 2: First Feature

- [ ] **Enable first auth factor(s)** — PIN, Pattern (or equivalent)
- [ ] **Write first endpoint** — Health check, then auth
- [ ] **Write abstraction layer** — `cacheService`, `dbService` (interface + mock)
- [ ] **Write auth middleware** — Rate limiter, nonce validator, JWT verifier
- [ ] **Write first tests** — Unit tests for auth, integration for health
- [ ] **Enable pre-push agent** — Sentry gates (compilation, docs, secrets)
- [ ] **Code review** — First PR reviewed against security patterns

---

## Phase 2: Architecture (Week 1)

- [ ] **Module structure** — Verify module dependency rules (DAG)
- [ ] **Provider abstraction** — Cache + DB + KMS interfaces
- [ ] **API design** — Route templates, error handling, response envelope
- [ ] **Auth middleware stack** — Rate limit → Nonce → JWT → RBAC → Ownership
- [ ] **Security patterns** — Constant-time, memory wipe, CSPRNG
- [ ] **Data protection** — Anonymization, TTL, consent management
- [ ] **Compliance documentation** — Data handling matrix for first feature

---

## Phase 3: Production Readiness (Month 1)

- [ ] **Security audit** — Full OWASP Top 10 review
- [ ] **Pentest** — All attack scenarios (04-SECURITY/06-pentest-checklist.md)
- [ ] **Compliance docs** — GDPR/CCPA/PIPEDA compliance documents
- [ ] **Documentation** — User guides, API docs, developer guides
- [ ] **CI/CD hardening** — Pre-push agent (all 3 agents: Sentry + Architect + Compliance)
- [ ] **Monitoring** — Error tracking, performance metrics, uptime
- [ ] **Incident response** — Runbook drafted, on-call rotation setup
- [ ] **Release** — v1.0.0 tag, CHANGELOG, release notes
