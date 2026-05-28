# Planning & Roadmap

## Planning Files (Mandatory)

Every project maintains exactly 2 planning documents:

### 1. `docs/internal/planning.md` (Strategic)

Long-term roadmap, phases, version goals:

```markdown
# Planning

## Phase 1: Foundation (v0.1 — v0.5)
- [ ] Core auth
- [ ] Basic API
- [ ] 2 auth factors

## Phase 2: Growth (v0.6 — v0.9)
- [ ] Multi-factor
- [ ] Admin portal
- [ ] Integration tests

## Phase 3: Production (v1.0)
- [ ] Security audit
- [ ] Pentest
- [ ] Compliance docs
```

**Rules:**
- Always list: Phase name, version range, completion %
- Update at every commit
- Block push if not updated in current session

### 2. `docs/internal/tasks.md` (Tactical)

Active tasks with timestamps:

```markdown
# Tasks

## 2026-05-27 10:00 — Implement SSRF middleware
- [ ] Write middleware
- [ ] Wire into routes
- [ ] Write tests

**LOC:** [Start: 0, End: 120]
```

**Rules:**
- Timestamp every entry (enables session resumption)
- Track LOC (lines of code) changes
- Mark completed tasks
- Block push if not updated

---

## Project Structure

```
/workspace/
├── README.md
├── CLAUDE.md          # Agent instructions (mirrored to GEMINI.md + .antigravity.md)
├── docs/
│   ├── internal/
│   │   ├── planning.md           # Roadmap, phases, version
│   │   ├── tasks.md              # Active tasks
│   │   ├── LESSONS_LEARNED.md    # Accumulated lessons
│   │   └── ARCHITECTURE.md       # System design
│   ├── 01-getting-started/       # Quick start
│   ├── 02-user-guides/           # User documentation
│   ├── 03-developer-guides/      # Dev documentation
│   ├── 04-architecture/          # Architecture docs
│   ├── 05-security/              # Security docs
│   ├── 06-deployment/            # Deployment docs
│   └── 10-internal/              # Internal (synced selectively)
├── backend/
├── sdk/
└── scripts/
```

**CRITICAL:** Pre-push agent blocks if `docs/internal/tasks.md` or `docs/internal/planning.md` aren't updated.

---

## Version Strategy

| Bump | When | Example |
|------|------|---------|
| **Major** | Breaking API change, security overhaul | 1.0.0 → 2.0.0 |
| **Minor** | New feature, non-breaking | 1.0.0 → 1.1.0 |
| **Patch** | Bug fix, security patch | 1.0.0 → 1.0.1 |
| **Pre-release** | alpha, beta, rc | 1.0.0-alpha.1 |

### Semantic Versioning (SemVer)

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
1.0.0-alpha.1+build.20260527
```

---

## Release Checklist

- [ ] All tests pass
- [ ] Security audit complete
- [ ] Pentest (if new features)
- [ ] Compliance docs updated
- [ ] CHANGELOG updated
- [ ] Version bumped
- [ ] Docker image built
- [ ] Docs synced
- [ ] tasks.md updated
- [ ] planning.md updated (% complete)
- [ ] `git tag v1.0.0`
