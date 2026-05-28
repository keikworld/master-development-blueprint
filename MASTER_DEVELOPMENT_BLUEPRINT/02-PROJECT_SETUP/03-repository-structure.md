# Repository Structure

## Monorepo vs Polyrepo

### Decision Matrix

| Factor | Monorepo | Polyrepo |
|--------|----------|----------|
| **Code sharing** | ✅ Trivial (same repo) | ❌ Requires package management |
| **Atomic changes** | ✅ Cross-module changes in one commit | ❌ Coordinated releases across repos |
| **CI/CD complexity** | ❌ Single pipeline must handle all | ✅ Independent pipelines per service |
| **Build times** | ❌ Longer (everything builds) | ✅ Faster (only changed service builds) |
| **Team autonomy** | ❌ Shared standards enforced | ✅ Each team owns their repo |
| **Tooling** | ✅ Nx, Turborepo, Gradle | ✅ Standard per-repo tooling |
| **Security boundary** | ❌ All code in one place | ✅ Repo-level access control |
| **Scaling limit** | Git repo size (10GB+ problematic) | No practical limit |

### Recommendation

| Team Size | Project Type | Structure |
|-----------|-------------|-----------|
| 1-5 devs | Single product | **Monorepo** — simpler, faster iteration |
| 5-20 devs | Multi-module product | **Monorepo** with modular structure |
| 20+ devs | Multiple products | **Polyrepo** — team autonomy matters more |
| **SDK/library** | Published to package registries | **Monorepo** — multi-module build |

**Default:** Monorepo with strict module boundaries.

---

## Monorepo Structure

```
project-root/
│
├── .github/                  # GitHub Actions workflows
│   └── workflows/
│       ├── ci-cd.yml         # Main CI/CD pipeline
│       ├── dependency-scan.yml # Weekly dependency vulnerability scan
│       └── sync-docs.yml     # Documentation sync (if relevant)
│
├── .claude/                  # Claude Code rules
│   ├── rules/
│   │   ├── GOVERNANCE.md     # 7-step governance workflow
│   │   └── *.md              # Additional rules
│   └── ...
│
├── backend/                  # API server
│   ├── src/
│   │   ├── routes/           # Route handlers (one per resource)
│   │   ├── services/         # Business logic
│   │   ├── middleware/        # Auth, rate limit, validation
│   │   ├── crypto/           # Encryption, signing, key management
│   │   ├── config/           # Secrets, env config
│   │   ├── utils/            # Logger, error handling, privacy utils
│   │   ├── jobs/             # Scheduled jobs (retention cleanup, etc.)
│   │   ├── database/         # Migrations, schemas, connection
│   │   └── templates/        # Router/service templates
│   ├── tests/                # Test files (mirrors src/ structure)
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── docs/                 # API docs, guides
│   ├── redis/                # TLS certs, Redis config
│   ├── .env.example          # All env vars with comments
│   ├── .env                  # Local env vars (gitignored)
│   ├── package.json
│   └── server.js             # Entry point
│
├── sdk/                      # Shared SDK (KMP or language-agnostic)
│   ├── src/
│   │   ├── commonMain/       # Platform-agnostic business logic
│   │   ├── androidMain/      # Android-specific implementations
│   │   ├── jsMain/           # Web/JS-specific implementations
│   │   └── iosMain/          # iOS-specific implementations (future)
│   ├── build.gradle.kts      # (if using KMP/Gradle)
│   └── ...
│
├── docs/                     # Documentation (mirror this structure)
│   ├── 01-getting-started/
│   ├── 02-user-guides/
│   ├── 03-developer-guides/
│   ├── 04-architecture/
│   ├── 05-security/
│   ├── 06-deployment/
│   ├── 07-testing/
│   ├── 08-business/
│   ├── 09-analysis/
│   ├── 10-internal/
│   └── 11-legacy/
│
├── scripts/                  # Automation scripts
│   ├── agent                 # Pre-push agent orchestration
│   ├── pre-push-agent.sh     # Git pre-push hook script
│   ├── pre-commit-agent.sh   # Git pre-commit hook script
│   ├── verify-patterns.sh    # Architecture pattern verification
│   ├── verify-compliance.sh  # GDPR/compliance verification
│   ├── audit-violations.sh   # CI audit script
│   ├── replace-console-log.sh # Console.log→logger migration
│   └── setup-*.sh            # Environment setup scripts
│
├── tests/                    # Cross-module tests
├── pentest/                  # Penetration testing suite
│   ├── scripts/
│   ├── scenarios/
│   └── reports/
│
├── ci/                       # CI/CD configuration
│   └── docker-compose.yml    # Local dev infrastructure
│
├── CLAUDE.md                 # LLM agent context (Claude Code)
├── gemini.md                 # LLM agent context (Gemini) — mirror
├── .antigravity.md           # LLM agent context (Antigravity) — mirror
├── AGENTS.md                 # Tool-agnostic agent quick reference
├── .env.example              # All env vars with comments
├── .gitignore
├── .editorconfig
├── README.md
└── LICENSE
```

---

## Module Boundaries

### Dependency Rules (Enforced by Pre-Push Agent)

```
sdk/          → None (foundation module, no internal deps)
enrollment/   → sdk/ only
merchant/     → sdk/ only
backend/      → None (standalone)
psp-sdk/      → sdk/ only
app/          → sdk/ + enrollment/ + merchant/
online-web/   → sdk/ only (Kotlin/JS)

FORBIDDEN:
enrollment/ ↔ merchant/   (circular dependency)
Any module → app/         (app is consumer, not library)
```

### Module Principles

1. **No circular dependencies** — Detectable by build system, blocked by pre-push
2. **SDK is single source of truth** — Shared logic lives in SDK, not duplicated in consumers
3. **Backend is independent** — No dependency on mobile/web SDK; communicates via API contracts
4. **Provider abstraction** — Cache, DB, secrets all have interfaces for swapping implementations

---

## File Naming Conventions

| Language | Convention | Example |
|----------|-----------|---------|
| Kotlin files | PascalCase | `PinProcessor.kt`, `FactorRegistry.kt` |
| JavaScript files | kebab-case | `pin-processor.js`, `factor-registry.js` |
| Test files | Match source + .test | `pin-processor.test.js` |
| Documentation | SNAKE_CASE | `FACTOR_TOGGLE_GUIDE.md` |
| SQL migrations | Sequential + description | `032_add_merchant_api_keys.sql` |
| Docker files | PascalCase | `Dockerfile`, `Dockerfile.dev` |

---

## Folder Documentation

Every non-trivial directory SHOULD have a `.md` file explaining:
- What belongs in this directory
- What does NOT belong
- How files in this directory relate to each other
- Any invariants or constraints

Example: `backend/docs/ROUTES_OVERVIEW.md`, `documentation/10-internal/DOCUMENTATION_ROUTING_RULES.md`
