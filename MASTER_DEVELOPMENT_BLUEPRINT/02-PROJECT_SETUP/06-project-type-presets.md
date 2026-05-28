# Project-Type Presets

## Purpose

This file tells the LLM which blueprint sections to recommend for each project type. Not everything applies to every project. Use this during Phase 3 (Pattern Matching) to filter what's relevant.

**Rule: If a section doesn't apply, skip it. Don't mention it. The developer shouldn't know it exists.**

---

## Matrix

| Pattern | web-api | cli-tool | kmp-lib | web-app | mobile-app | microservice |
|---------|---------|----------|---------|---------|------------|--------------|
| Provider abstraction | maybe¹ | no | yes | no | maybe² | yes |
| 3-tier rate limiting | yes | no | no | no | no | yes |
| Input validation (5-layer) | yes | yes | yes | yes | yes | yes |
| Memory wiping | maybe³ | no | maybe³ | no | maybe³ | maybe³ |
| Cryptography | maybe⁴ | maybe⁴ | yes | no | yes | maybe⁴ |
| Feature flags | yes | no | yes | yes | yes | yes |
| Processing pipeline | maybe⁵ | no | yes | no | no | yes |
| Retry pattern | yes | no | no | yes | yes | yes |
| Rate limiting (basic) | yes | no | no | no | no | yes |
| Watchdog | yes | no | no | no | no | yes |
| Agent orchestration | maybe⁶ | no | no | no | no | maybe⁶ |
| Governance records | yes | yes | yes | yes | yes | yes |
| Testing strategy | yes | yes | yes | yes | yes | yes |
| Universal rules | ALWAYS | ALWAYS | ALWAYS | ALWAYS | ALWAYS | ALWAYS |

**Key:**
- `yes` = Always recommend during Phase 3
- `no` = Never recommend (skip the section entirely)
- `always` = Non-negotiable, always apply
- `maybe` = Only recommend if conditions met (see footnotes)

**Footnotes:**

1. Provider abstraction: recommend ONLY if project plans to support multiple DB/cache providers. For single-provider prototypes, skip but note: "You don't need this yet, but here's when you will: when you add a second server or want to swap Redis for PostgreSQL."

2. mobile-app: recommend provider abstraction if using local-first + sync architecture.

3. Memory wiping: recommend ONLY if project handles secrets, keys, passwords, or PII in memory. For CLI tools that access APIs via tokens, recommend token handling with memory wiping but skip the general cryptography sections.

4. Cryptography: Skip comprehensive cryptography sections for projects using third-party auth (Auth0, Clerk, Firebase). Only recommend if project implements custom auth, manages keys, or handles encrypted data.

5. Processing pipeline: skip for simple CRUD. Recommend for projects with complex data transformation workflows.

6. Agent orchestration: skip for small teams (<3 people). Recommend for teams that need automated code review, security scanning, or multi-agent workflows.

---

## Quick Reference by Type

### web-api

**Blueprint sections:**

| Always Apply | Skip |
|-------------|------|
| `01-FOUNDATION/03-universal-rules` | `03-ARCHITECTURE/06-processing-pipeline` (skip unless complex transforms) |
| `04-SECURITY/07-input-validation` (5-layer) | `12-APPENDIX/*` (reference only) |
| `04-SECURITY/08-memory-wiping` (if handling secrets) | `10-LESSONS_LEARNED/01-architecture` (reference only) |
| `05-DEVELOPMENT/02-testing-strategy` | `09-AUTOMATION_AGENTS/02-watchdog` (only if production multi-service) |
| `05-DEVELOPMENT/05-feature-flags` | |
| `06-INFRASTRUCTURE/03-rate-limiting` | |
| `06-INFRASTRUCTURE/04-retry-pattern` | |
| `11-CHECKLISTS/06-governance-records` | |
| `11-CHECKLISTS/07-documentation-matrix` | |

**Decision tree priorities:**
- Provider abstraction: Redis? DB? Third-party APIs?
- Rate limiting: in-memory? Redis-based? Distributed?
- Error handling: centralized error middleware?
- Logging: structured logger setup (winston/pino/bunyan)?

**Example frameworks:** Express, FastAPI, Spring Boot, Gin, Actix-web

### cli-tool

**Blueprint sections:**

| Always Apply | Skip |
|-------------|------|
| `01-FOUNDATION/03-universal-rules` | Everything in `06-INFRASTRUCTURE/` (no server to deploy) |
| `04-SECURITY/07-input-validation` | `03-ARCHITECTURE/04-api-design` (no API) |
| `04-SECURITY/08-memory-wiping` (if handling tokens) | `03-ARCHITECTURE/05-provider-abstraction` |
| `05-DEVELOPMENT/02-testing-strategy` | `05-DEVELOPMENT/05-feature-flags` |
| `11-CHECKLISTS/06-governance-records` | `09-AUTOMATION_AGENTS/*` |
| | `06-INFRASTRUCTURE/03-rate-limiting` |

**Key considerations:**
- Input validation focuses on CLI args, not HTTP
- Error handling: exit codes, stderr output
- Config: dotenv files, config hierarchy (env > config file > defaults)
- Packaging: distribution (npm pip cargo homebrew)

**Example frameworks:** Commander, Click, Cobra, Clap

### kmp-library

**Blueprint sections:**

| Always Apply | Skip |
|-------------|------|
| `01-FOUNDATION/03-universal-rules` | `06-INFRASTRUCTURE/03-rate-limiting` |
| `04-SECURITY/03-cryptography` | `04-SECURITY/01-authentication` (unless lib provides auth) |
| `04-SECURITY/07-input-validation` | `09-AUTOMATION_AGENTS/02-watchdog` |
| `04-SECURITY/08-memory-wiping` | `06-INFRASTRUCTURE/01-deployment` |
| `05-DEVELOPMENT/02-testing-strategy` | |
| `05-DEVELOPMENT/05-feature-flags` | |
| `03-ARCHITECTURE/06-processing-pipeline` | |
| `11-CHECKLISTS/06-governance-records` | |

**Key considerations:**
- KMP separation: expect/actual pattern, platform-specific source sets
- No platform imports in commonMain (enforced by build)
- expect class members must be explicit (Kotlin 2.x K2 requirement)
- JS crypto is async-only — use suspend functions
- commonTest cannot use platform-only APIs (runs on JS too)

### web-app

**Blueprint sections:**

| Always Apply | Skip |
|-------------|------|
| `01-FOUNDATION/03-universal-rules` | `04-SECURITY/03-cryptography` (unless doing client-side crypto) |
| `04-SECURITY/07-input-validation` | `06-INFRASTRUCTURE/03-rate-limiting` (server handles this) |
| `04-SECURITY/08-memory-wiping` | `03-ARCHITECTURE/05-provider-abstraction` |
| `05-DEVELOPMENT/02-testing-strategy` | |
| `11-CHECKLISTS/06-governance-records` | |

**Key considerations:**
- XSS prevention is top priority
- Input validation on client and server (never trust client)
- CSP headers, CORS configuration
- Bundle size, tree-shaking, code splitting
- State management choice affects architecture

**Example frameworks:** React, Vue, Svelte, Solid, HTMX + Alpine

### mobile-app

**Blueprint sections:**

| Always Apply | Skip |
|-------------|------|
| `01-FOUNDATION/03-universal-rules` | `06-INFRASTRUCTURE/03-rate-limiting` (server handles) |
| `04-SECURITY/07-input-validation` | `06-INFRASTRUCTURE/01-deployment` |
| `04-SECURITY/08-memory-wiping` (token storage) | |
| `05-DEVELOPMENT/02-testing-strategy` | |
| `05-DEVELOPMENT/05-feature-flags` | |
| `11-CHECKLISTS/06-governance-records` | |

**Key considerations:**
- Secure storage (Keychain/Keystore) for tokens
- Biometric authentication integration
- Offline-first architecture considerations
- Deep linking security
- Certificate pinning
- Permission model (Android/iOS differences)

**Example frameworks:** SwiftUI, Jetpack Compose, Flutter, React Native

### microservice

**Blueprint sections:**

| Always Apply | Skip |
|-------------|------|
| Same as web-api, PLUS: | `08-PROJECT_MANAGEMENT/*` (per-service, not top-level) |
| `06-INFRASTRUCTURE/03-rate-limiting` (distributed) | |
| `06-INFRASTRUCTURE/04-retry-pattern` (service-to-service) | |
| `06-INFRASTRUCTURE/02-ci-automation` | |
| `09-AUTOMATION_AGENTS/02-watchdog` | |

**Key considerations:**
- Service discovery, health checks
- Distributed tracing
- Circuit breaker per downstream service
- Idempotency for all mutating endpoints
- Graceful degradation (degraded vs available)
- Rate limiting at gateway AND service level

---

## How the LLM Uses This

During Phase 3 (Pattern Matching), the LLM should:

1. Identify project type from Discovery answers
2. Consult this matrix for that type
3. Present ONLY the relevant sections to the developer
4. For `maybe` items, check the footnote condition and explain: "You might benefit from X if [condition]. Do you [condition]?"

**Example prompt to developer:**
> "Your project is a Node.js REST API handling payments. Based on the blueprints presets for web-api, here's what I recommend:
>
> **Essential:** Input validation (5-layer defense), rate limiting (3-tier), retry patterns, universal rules
> **Optional:** Provider abstraction (needed if you plan multiple DB backends — are you?)
> **Skip:** Processing pipeline (your CRUD flow doesn't need it), agent orchestration (small team)
>
> Let's start with the essentials. First..."
