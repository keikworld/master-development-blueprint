# CI/CD Pipeline

## 3-Layer Violation Detection

| Layer | When | What | Who Runs |
|-------|------|------|----------|
| **Layer 1: Startup Validator** | Server boot | Validates env vars, PRIVACY_APP_SALT strength, production config safety | `server.js` on startup |
| **Layer 2: Pre-Push Agent** | Every `git push` | 56 checks across 3 agents (Sentry, Architect, Compliance) | Git hook |
| **Layer 3: CI Audit Script** | CI pipeline | 10 violation pattern checks (hardcoded secrets, console.log, missing TTL) | `audit-violations.sh` |

**Why 3 layers:** A single layer can miss violations (e.g., edits made after pre-push check, env vars changed after startup). Redundancy ensures comprehensive coverage.

## Pre-Push Agent Architecture

Every git push triggers a 3-agent verification:

```
┌──────────────────────────────────────────────┐
│                git push                      │
│                    │                         │
│                    ▼                         │
│  ┌─────────────────────────────────┐        │
│  │     Agent 1: The Sentry         │        │
│  │  - Compilation check            │        │
│  │  - Documentation sync check     │        │
│  │  - Env variable sync check      │        │
│  │  - Secrets detection            │        │
│  └─────────────┬───────────────────┘        │
│                │                             │
│                ▼                             │
│  ┌─────────────────────────────────┐        │
│  │     Agent 2: The Architect      │        │
│  │  - KMP separation (no platform  │        │
│  │    imports in commonMain)       │        │
│  │  - Security pattern compliance  │        │
│  │  - XSS prevention               │        │
│  │  - Redis TTL enforcement        │        │
│  │  - Android manifest checks      │        │
│  │  - Salted hash verification     │        │
│  └─────────────┬───────────────────┘        │
│                │                             │
│                ▼                             │
│  ┌─────────────────────────────────┐        │
│  │   Agent 3: The Compliance       │        │
│  │  - GDPR/CCPA/PIPEDA checks      │        │
│  │  - PII detection                │        │
│  │  - BIPA compliance              │        │
│  │  - SCA/PSD3 compliance          │        │
│  │  - Auth pattern compliance      │        │
│  └─────────────┬───────────────────┘        │
│                │                             │
│                ▼                             │
│           Push Accepted ✅                   │
└──────────────────────────────────────────────┘
```

### Agent Check Count

| Agent | Check Count | What's Checked |
|-------|-------------|----------------|
| Sentry | 9 checks | Compilation, docs, env sync, secrets |
| Architect | 24 checks | KMP, security, XSS, Redis, manifest, salting |
| Compliance | 23 checks | GDPR, PII, BIPA, SCA, auth patterns |
| **Total** | **56 checks** | |

---

## CI Workflow Stages

```yaml
name: CI Pipeline
on: [push, pull_request]

jobs:
  # Stage 1: Fast feedback (runs in <2 min)
  lint-and-format:
    - ESLint / Detekt
    - Prettier / KtLint
    - Block on errors

  # Stage 2: Unit tests (runs in <5 min)
  unit-tests:
    - npm test (backend)
    - ./gradlew :sdk:test (SDK)
    - Coverage threshold check

  # Stage 3: Service tests (runs in <15 min)
  service-tests:
    - npm run test:services
    - Mock Redis auto-configured

  # Stage 4: Integration tests (runs in <15 min)
  integration-tests:
    - npm run test:integration
    - Docker-based dependencies
    - Clean DB per run

  # Stage 5: Security scan (runs weekly + on dependency changes)
  dependency-scan:
    - npm audit
    - OWASP Dependency-Check
    - Trivy filesystem scan
    - Block on CRITICAL vulnerabilities

  # Stage 6: Pentest (runs on release)
  penetration-testing:
    - SSRF tests
    - Replay attack tests
    - Timing attack tests
    - Race condition tests
```

---

## Env Variable Sync

All environment variables must exist in ALL of these locations:

| Location | Purpose |
|----------|---------|
| `.env.example` | Development reference |
| `ci-cd.yml` | CI/CD configuration |
| `.env.production` | Production secrets (git-crypt) |
| `documentation/03-developer-guides/ENV_REFERENCE.md` | Documentation |

### Sync Checking

Pre-push agent verifies:
1. Every var in `.env.example` exists in CI workflow
2. Every var in CI workflow exists in `.env.example`
3. No hardcoded secrets in any file
4. All secrets use env var references

---

## Build Artifacts

| Artifact | When Built | Storage | Retention |
|----------|-----------|---------|-----------|
| npm packages | On tag | npm registry | Permanent |
| Docker images | On push to master | Container registry | 30 tags |
| Test coverage report | Every CI run | CI artifacts | 30 days |
| Pentest report | On release | CI artifacts | 90 days |
| Dependency scan | Weekly | CI artifacts | 90 days |
| Audit readiness | On release | S3/Blob | Permanent |
