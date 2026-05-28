# Pivot Checklist

## When pivoting an existing codebase (e.g., an existing project → new product)

### Assessment Phase

- [ ] **Read CLAUDE.md** — Complete project overview, build commands, patterns
- [ ] **Read planning.md + tasks.md** — Current state, active work
- [ ] **Read LESSONS_LEARNED.md** — All 100+ lessons (prevents repeating mistakes)
- [ ] **Read ARCHITECTURE.md** — Module structure, dependencies, decision records
- [ ] **Run `./scripts/agent @all`** — Verify current state passes all gates
- [ ] **Run tests** — Baseline: `npm test`, `./gradlew :sdk:test`
- [ ] **Read GATES.md** — 7 non-negotiable rules with import tables

### What to Keep

- [ ] **Architecture patterns** — Module dependency rules, provider abstraction
- [ ] **Security patterns** — Constant-time, memory wipe, CSPRNG, replay protection
- [ ] **Developer process** — Pre-push agents, planning docs, compliance workflow
- [ ] **Testing infrastructure** — Test commands, mock patterns, coverage thresholds
- [ ] **API conventions** — Response envelope, error handling, versioning
- [ ] **Secrets management** — Env hierarchy, KMS pattern, buffer wiping
- [ ] **Data protection** — Anonymization, TTL, privacy utils, structured logging

### What to Replace

- [ ] **Domain logic** — Replace payment/auth factors with new domain
- [ ] **Module names** — Rename packages to match new project
- [ ] **Env variables** — Update PRIVACY_APP_SALT, database URLs, API keys
- [ ] **Branding** — README, UI text, marketing (follow 2-tier strategy)
- [ ] **Documentation** — Update all user-facing docs to new brand

### Migration Steps

```bash
# 1. Fork/copy the repo
git clone <source-repo> <new-repo>

# 2. Rename packages systematically
#    - SDK package: com.oldproject → com.newproject
#    - Backend routes: /v1/oldproject → /v1/newproject
#    - Env vars: ZEROPAY_ → NEWPROJECT_

# 3. Update env files
#    - New PRIVACY_APP_SALT (openssl rand -base64 32)
#    - New JWT secret (openssl rand -base64 32)
#    - New database credentials

# 4. Install pre-push hooks
chmod +x scripts/agent
ln -sf ../../scripts/pre-push-agent.sh .git/hooks/pre-push

# 5. Run full check
./scripts/agent @all

# 6. Verify tests pass
npm test && ./gradlew :sdk:test
```

### Documentation Updates for Pivot

| File | Action |
|------|--------|
| CLAUDE.md | Replace all old project references, update project overview, keep patterns |
| GEMINI.md | Mirror CLAUDE.md |
| .antigravity.md | Mirror CLAUDE.md |
| AGENTS.md | Update check counts, commands, paths |
| README.md | Rewrite for new project, keep 2-tier branding note |
| planning.md | Start fresh or align with new roadmap |
| tasks.md | Start fresh with pivot as first task |
| LESSONS_LEARNED.md | **KEEP ALL** — they cost money to learn, save them for the new project |

### Go/No-Go Gate

Before committing the pivot, verify:

- [ ] `./scripts/agent @all` passes (exit 0)
- [ ] All tests pass (`npm test`, `./gradlew :sdk:test`)
- [ ] No reference to old project in env files or secrets
- [ ] New PRIVACY_APP_SALT generated
- [ ] New JWT signing keys generated
- [ ] Database migrations reflect new schema
- [ ] Documentation references new project name
- [ ] CI/CD pipelines updated for new deployment targets
