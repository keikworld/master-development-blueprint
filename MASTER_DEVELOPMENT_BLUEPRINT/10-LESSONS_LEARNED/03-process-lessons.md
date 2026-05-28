# Process Lessons Learned

## Lesson 1: The 7-Step Governance Workflow (/build)

**What went wrong**: Developers would start coding immediately, skipping planning and inventory. The result: wrong imports, missing patterns, broken architecture.

**Pattern**: Before any code (>50 LOC or >2 files), run the 7-step workflow:

```
1. SCOPE     — State what in 1-2 sentences. Estimate LOC.
2. INVENTORY — For every module imported: READ the actual source file.
               Verify export names + function signatures. Never assume.
3. PATTERN   — Read 2-3 existing files in same directory. Follow their
               import, error-handling, and response patterns — don't invent new.
4. GATES     — Check 7 mandatory gates:
               1. Imports verified against actual source files
               2. Secrets go through secrets.js / config
               3. Privacy defaults (anonymize, minimize, TTL)
               4. Constant-time comparisons for secrets/digests
               5. BIPA check (biometric jurisdiction)
               6. Safe error messages (no error.message leaks)
               7. Plan presented to team for approval
5. PLAN      — Present scope + deps + pattern reference + gate compliance.
               Wait for approval.
6. CODE      — Write code. New router → start from template.
               New service → start from template.
7. VALIDATE  — Compile check for every file.
               Run relevant tests. Fix failures.
```

**ROI**: Prevents ~60% of bugs at the planning stage (production data: 100+ lessons, substantial portion attributed to skipping inventory/pattern steps).

## Lesson 2: Update Docs in the Same Commit

**What went wrong**: Code was merged. Documentation updates were lost. Three months later, nobody remembered what the env vars were or why the pattern existed.

**Pattern**: Documentation updates go in the SAME commit as code changes. Pre-push agent enforces this.

```bash
# Always: code + docs in one commit
git add backend/routes/newRouter.js
git add documentation/10-internal/task.md      # ← updated timestamp
git add documentation/10-internal/planning.md   # ← updated phase %
git commit -m "feat: add new feature with docs"
```

**What must be updated per commit**:
| Change Type | Must Update |
|-------------|-------------|
| Any code change | `task.md` (timestamp), `planning.md` (phase %) |
| New endpoint | API docs, `.env.example` |
| New security fix | `SECURITY_AUDIT.md`, `LESSONS_LEARNED.md` |
| New pattern | `DEVELOPMENT_RULES.md`, `LESSONS_LEARNED.md` |

## Lesson 3: Task and Planning Docs Are Not Optional

**What went wrong**: Without a shared task board, team members duplicated work, stepped on each other's changes, and had no way to track progress.

**Pattern**: Two living documents:

```
documentation/10-internal/
  ├── task.md       — What's being worked on RIGHT NOW
  │                    • Active tasks with timestamps
  │                    • LOC counts, phase, version
  │                    • Updated every session
  └── planning.md   — The roadmap
                       • Phases (1-N) with % complete
                       • Version targets
                       • Strategic direction
```

**Pre-push enforcement**:
```bash
# The Sentry agent checks:
if code_changed > 0 && (task_not_updated || planning_not_updated):
    BLOCK PUSH
```

## Lesson 4: Mirror Agent Configuration Files

**What went wrong**: CLAUDE.md (for Claude Code) was updated with new patterns. GEMINI.md and .antigravity.md were not. Different agents gave different guidance.

**Pattern**: Agent configuration files are full mirrors — identical content:

```
CLAUDE.md      ← Source of truth
GEMINI.md      ← Full mirror (Gemini audience)
.antigravity.md ← Full mirror (Antigravity audience)
AGENTS.md      ← Different format (concise, tool-agnostic)
                 but same facts (check counts, commands, paths)
```

**Rule**: Update all four in the same commit when facts change.

**Enforcement**: Pre-push checks that `diff CLAUDE.md GEMINI.md` is empty and `diff CLAUDE.md .antigravity.md` is empty.

## Lesson 5: Agent Scripts Must Be Executable (100755)

**What went wrong**: Agent scripts committed as `100644` (non-executable). Git hooks called `./script.sh` and got `exit 126` (permission denied). The error looked like "check passed" because the hook script started but the sub-script silently failed.

**Pattern**: All agent scripts must be tracked as executable:

```bash
# After creating/modifying any agent script:
chmod +x scripts/agent
git add scripts/agent
git update-index --chmod=+x scripts/agent

# Verify:
ls -la scripts/agent          # should show -rwxr-xr-x (100755)
git ls-files --stage scripts/agent  # should show 100755
```

**The real issue**: `.sh` at the end doesn't matter. `./script.sh` requires execute bit. `bash script.sh` does not. The exit 126 from a helper script masqueraded as a check passing because the main hook continued after the sub-script permission failure.

## Lesson 6: Hook Symlinks Are Per-Clone

**What went wrong**: Git hooks were committed to `.git/hooks/` — impossible (`.git/` is not committed). Developers thought hooks were "set up" because the files existed in the repo, but they weren't symlinked.

**Pattern**: Hooks live in `scripts/` and are symlinked per-clone:

```bash
# Run once per clone (documented in setup guide):
ln -sf ../../scripts/pre-push-agent.sh   .git/hooks/pre-push
ln -sf ../../scripts/pre-commit-agent.sh .git/hooks/pre-commit
```

**Diagnosis**: If `git push` finishes in <1s without the "Agent 2: The Sentry" banner, the hook symlink is missing.

## Lesson 7: Test First, Framework Second

**What went wrong**: Team argued for weeks about which test framework to use (Mocha vs Jest vs Bugster). Meanwhile, zero tests were written.

**Pattern**: Pick a framework in 30 minutes. Start testing immediately. The framework matters far less than the habit of writing tests.

**Decision matrix**:
| Scenario | Tool |
|----------|------|
| Node.js backend | Mocha + Chai |
| Kotlin/JS web UI | Bugster (YAML-based, headless browser) |
| KMP SDK | JUnit |

## Lesson 8: Pre-Commit Is for Safety, Pre-Push Is for Quality

**What went wrong**: One git hook tried to do everything (lint + test + security scan + deploy check). It took 5+ minutes per commit. Developers disabled it.

**Pattern**: Split responsibilities:

```
pre-commit (runs every commit, must be fast):
  • File formatting check (whitespace, trailing commas)
  • No debug code (console.log, TODO committed)
  • No large files (>1MB)
  ⏱ Target: <5 seconds

pre-push (runs before push, can be thorough):
  • Full test suite
  • Security pattern scan
  • Documentation freshness check
  • Environment variable sync
  ⏱ Target: <60 seconds
```

## Lesson 9: Compliance First, Features Second

**What went wrong**: A new biometric feature shipped without a compliance matrix. An auditor later discovered that `Fingerprint` factor enrollment lacked the required BIPA (Illinois Biometric Information Privacy Act) consent flow. The team spent 3x the original dev cost retrofitting compliance.

**Pattern**: For ANY feature >100 LOC, complete a compliance data matrix BEFORE writing code:

| Question | Answer Before Coding |
|----------|---------------------|
| What data enters? | Field name, source, format |
| What is stored? | Where, encrypted?, TTL? |
| What leaves? | To whom, what fields? |
| What is NOT collected? | Explicit exclusions |
| Legal basis? | GDPR Art. 6 for each field |

Document in `documentation/05-security/[FEATURE]_COMPLIANCE.md` — committed WITH the feature code.

## Lesson 10: Governance Records — Risk, Decisions, and Failures Must Be Documented

**What went wrong**: A feature was built without a risk assessment. Months later, an auditor asked: "What data does this store? What's your legal basis? Who decided to use this approach?" The team had no answers.

**Pattern**: Three mandatory governance documents accompany every feature:

### Risk Assessment Matrix (Before Code)
```
For every feature >100 LOC:
1. Data inventory: what enters, what's stored, what leaves
2. Threat scenarios: what could go wrong, likelihood, impact
3. Risk levels: LOW (accept) / MEDIUM (mitigate) / HIGH (block) / CRITICAL (stop)
4. Legal basis: GDPR Art. 6 for each stored data point
5. Zero-approach table: what we know, what we don't know, decision
```

### Decision Log (During Architecture)
```
Every architecture/tech/trade-off decision gets:
DECISION-001: Title, date, author, status
- Options considered with pros/cons
- Chosen option with rationale
- Rejected options with reasons
- Consequences (positive + negative)
- Compliance check
```

### Failure Log (After Incidents)
```
Every production bug or incident gets:
FAIL-001: Title, date, severity, status
- What happened, root cause, impact
- Detection method and gap
- Fix applied (with commit link)
- Prevention: specific actions
- Action items with owners and dates
```

### Co-Author Attribution

**Every commit includes the user as co-author.** This creates an audit trail of who decided what:

```bash
git commit -m "feat: add risk assessment + auth middleware" \
  --author="developer" \
  -m "Co-authored-by: rastafalso <keikworldproject@gmail.com>"
```

This is non-negotiable. Without co-author attribution, the git history only shows the LLM/automation, not the human who made the decisions.

### Why This Matters

| Without Governance | With Governance |
|-------------------|-----------------|
| "Why did we use Redis?" — nobody remembers | DECISION-001: "Redis chosen for TTL maps to 24h digest expiry. In-memory fallback for dev." |
| "What data does this endpoint store?" — guess | Risk assessment: data inventory table with retention + legal basis |
| "We had this bug before..." — repeats every 6 months | FAIL-001: "Non-constant-time comparison. Prevention: grep check added to verify-compliance.sh" |
| "Who decided this?" — finger-pointing | Co-author: rastafalso decided, LLM implemented. Commit shows both. |
| "Is this GDPR compliant?" — expensive audit | Risk assessment has legal basis for every stored field. |

### Enforcement

- Pre-push hook checks that code changes have corresponding risk/decision docs
- CI audit checks for DECISION-XXX and FAIL-XXX numbering continuity
- Every commit must have `Co-authored-by:` with a human

## Lesson 11: Pre-Push Checklist (Quick Reference)

```
□ A. TESTING
   - Code compiles
   - Tests pass and cover new/changed code
   - 80% coverage for new code

□ B. SECURITY
   - Constant-time comparisons for secrets/digests
   - No hardcoded credentials
   - OWASP Top 10 checked (SQLi, XSS, SSRF, etc.)

□ C. PRIVACY
   - Data minimization: collect only what's needed
   - Anonymization: hash device IDs, anonymize IPs
   - Retention: TTL set on every Redis key
   - No user tracking capability built in

□ D. GOVERNANCE (NEW — MANDATORY)
   - Risk assessment matrix created for new features
   - Decision log entry (DECISION-XXX) for architecture choices
   - Failure/incident log entry (FAIL-XXX) for bugs fixed
   - Co-author attribution on every commit (Co-authored-by:)

□ E. DOCUMENTATION
   - Read 11-CHECKLISTS/07-documentation-matrix.md — which docs must update for this change
   - task.md updated (timestamp + description)
   - planning.md updated (phase % + version)
   - LESSONS_LEARNED.md updated for new insights
   - Documentation updated in SAME commit as code (pre-push enforced)

□ F. CONFIG
   - New env vars in ALL required files (.env.example, CI)
   - Feature flags disabled by default
```
