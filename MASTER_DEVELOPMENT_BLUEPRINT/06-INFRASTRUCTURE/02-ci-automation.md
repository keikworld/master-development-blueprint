# CI & Automation

## Agent System Architecture

### The Problem

Traditional CI/CD runs checks AFTER push. If a push fails, the developer context-switches to fix it, then the commit message history is polluted with "fix lint" and "fix test" commits.

### The Pattern: Shift Left with Pre-Push Agents

Run 56 checks BEFORE the push reaches CI. CI is the last resort, not the first line of defense.

```
Developer commits
  │
  ├─ pre-commit hook (<5s)
  │   • File formatting
  │   • No debug code
  │   • No large files
  │
  ├─ pre-push hook (~30-60s)
  │   │
  │   ├─ @sentry (9 checks): The Gatekeeper
  │   │   • Documentation freshness?
  │   │   • Code compiles? (node -c)
  │   │   • Env vars synced?
  │   │   • Migration files exist?
  │   │   • No secrets committed?
  │   │
  │   ├─ @architect (24 checks): The Pattern Enforcer
  │   │   • KMP separation? (no Android in commonMain)
  │   │   • Circular dependencies?
  │   │   • Security patterns? (Math.random, weak crypto)
  │   │   • Redis performance? (KEYS vs SCAN)
  │   │   • XSS prevention? (innerHTML with user data)
  │   │   • Documentation placement?
  │   │
  │   └─ @compliance (23 checks): The Regulator
  │       • PII leakage in logs? (GDPR)
  │       • Data minimization?
  │       • Biometric handling? (BIPA)
  │       • Constant-time operations?
  │       • Nonce validation?
  │
  ├─ CI (GitHub Actions, ~5-10 min)
  │   • Lint + Code Quality
  │   • Backend Tests (mocked deps)
  │   • Integration Tests (Docker services)
  │   • SDK Tests (Gradle)
  │   • Agent Validation (re-run @all)
  │   • Violation Audit
  │   • Dependency Scan
  │
  └─ Deploy
```

### Agent Command Center

```bash
# Single unified interface for all agents
./scripts/agent @all          # 56 checks total
./scripts/agent @sentry       # Gatekeeper (9 checks)
./scripts/agent @architect    # Patterns (24 checks)
./scripts/agent @compliance   # Regulations (23 checks)
```

### Implementation: The Sentry (pre-push-agent.sh)

```bash
#!/bin/bash
# Agent 2: The Sentry — Pre-Push Gatekeeper

EXIT_CODE=0
REMOTE_REF="origin/master"
CHANGED_FILES=$(git diff --name-only $REMOTE_REF..HEAD)
CODE_CHANGED=$(echo "$CHANGED_FILES" | grep -E "\.(kt|js|java|kts)$" | wc -l)

# Check: Documentation freshness
if [ "$CODE_CHANGED" -gt 0 ]; then
  TASK_UPDATED=$(echo "$CHANGED_FILES" | grep "task.md" | wc -l)
  PLANNING_UPDATED=$(echo "$CHANGED_FILES" | grep "planning.md" | wc -l)
  if [ "$TASK_UPDATED" -eq 0 ] || [ "$PLANNING_UPDATED" -eq 0 ]; then
    echo "FAIL: Code changed but docs not updated"
    EXIT_CODE=1
  fi
fi

# Check: Compilation sanity
for file in $(echo "$CHANGED_FILES" | grep "\.js$"); do
  if [ -f "$file" ]; then
    node -c "$file" 2>/dev/null || { echo "FAIL: $file has syntax errors"; EXIT_CODE=1; }
  fi
done

exit $EXIT_CODE
```

### Implementation: The Architect (verify-patterns.sh)

```bash
#!/bin/bash
# Agent 1: The Architect — Pattern Verification (24 checks)

EXIT_CODE=0

# KMP Separation: No Android imports in commonMain
ANDROID_IN_COMMON=$(find sdk/src/commonMain -name "*.kt" | xargs grep -l "import android\." 2>/dev/null | wc -l)
[ "$ANDROID_IN_COMMON" -gt 0 ] && { echo "FAIL: Android imports in commonMain"; EXIT_CODE=1; }

# Security: No Math.random in security contexts
MATH_RANDOM=$(grep -rn "Math\.random" backend/ --include="*.js" | grep -v test | grep -v node_modules | wc -l)
[ "$MATH_RANDOM" -gt 0 ] && { echo "WARN: Math.random in production code"; EXIT_CODE=1; }

# Performance: No Redis KEYS command
REDIS_KEYS=$(grep -rn "\.keys(" backend/ --include="*.js" | grep -v "hash\|Object\|Object\.keys\|\.env\|process\.env\|\.key\|\.keys()" | wc -l)
[ "$REDIS_KEYS" -gt 0 ] && { echo "FAIL: Redis KEYS in production - use SCAN"; EXIT_CODE=1; }

# XSS: No innerHTML with dynamic data
INNER_HTML=$(grep -rn "innerHTML" online-web/src/ --include="*.kt" | wc -l)
[ "$INNER_HTML" -gt 0 ] && { echo "FAIL: innerHTML in web code - use kotlinx-html DSL"; EXIT_CODE=1; }

# Agent scripts must be executable
NON_EXEC_AGENTS=$(find scripts/ -name "*.sh" -o -name "agent" | xargs ls -la | grep "^-rw-r--r--" | wc -l)
[ "$NON_EXEC_AGENTS" -gt 0 ] && { echo "FAIL: Agent scripts not executable (should be 100755)"; EXIT_CODE=1; }

exit $EXIT_CODE
```

### Implementation: The Compliance Officer (verify-compliance.sh)

```bash
#!/bin/bash
# Agent 3: The Compliance Officer — Regulatory Compliance (23 checks)

EXIT_CODE=0

# PII Leakage: console.log with sensitive terms
PII_LEAKS=$(grep -rn "console\.\(log\|error\|warn\)" backend/routes/ backend/services/ \
  | grep -iE "(password|token|secret|key|credential|cvv|pan|biometric|fingerprint|voice)" \
  | wc -l)
[ "$PII_LEAKS" -gt 0 ] && { echo "FAIL: PII leakage in logs"; EXIT_CODE=1; }

# Data Minimization: raw IPs in storage
RAW_IPS=$(grep -rn "req\.body\.ip\|body\.ipAddress\|body\.clientIp" backend/routes/ --include="*.js" | wc -l)
[ "$RAW_IPS" -gt 0 ] && { echo "FAIL: Client-supplied IPs forbidden — use req.ip"; EXIT_CODE=1; }

# Biometric consent checks (BIPA)
BIPA_VIOLATIONS=$(grep -rn "biometric\|fingerprint\|face" backend/routes/ --include="*.js" \
  | grep -v "consent\|BIPA\|bipa\|exclude\|metadata" | wc -l)
[ "$BIPA_VIOLATIONS" -gt 0 ] && { echo "WARN: Biometric endpoints without consent check"; EXIT_CODE=2; }

exit $EXIT_CODE
```

### CI Audit (audit-violations.sh)

18 automated checks run in CI that detect known violation patterns:

```bash
#!/bin/bash
# scripts/audit-violations.sh
# Exit codes: 0 = clean, 1 = violations found

EXIT_CODE=0
VIOLATIONS=0

# Check 1: console.log in production backend code
CONSOLE_HITS=$(grep -rn "console\.\(log\|error\|warn\|info\|debug\)" \
  backend/services/ backend/routes/ backend/middleware/ --include="*.js" \
  | grep -v node_modules | grep -v "\.test\." | grep -v memoryRedis | wc -l)
[ "$CONSOLE_HITS" -gt 0 ] && { fail; echo "Found $CONSOLE_HITS console.* calls"; }

# Check 2: Non-constant-time comparisons for secrets
# ... (15 more checks)

echo "SUMMARY: $VIOLATIONS violations, $WARNINGS warnings"
exit $EXIT_CODE
```

### CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push: { branches: [master, develop] }
  pull_request: { branches: [master, develop] }

env:
  NODE_VERSION: '20'
  JAVA_VERSION: '17'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4 with: { node-version: "${{ env.NODE_VERSION }}" }
      - run: cd backend && npm ci
      - run: cd backend && npm run lint
      - run: ./scripts/agent @all || true  # Non-blocking in CI

  backend-tests:
    runs-on: ubuntu-latest
    needs: lint
    services:
      redis: { image: redis:7, ports: ["6379:6379"] }
      postgres: { image: postgres:15-alpine, env: { POSTGRES_PASSWORD: test }, ports: ["5432:5432"] }
    steps:
      - uses: actions/checkout@v4
      - run: cd backend && npm ci
      - run: cd backend && npm test                    # Unit tests
      - run: cd backend && npm run test:services       # Service tests
      - run: cd backend && npm run test:integration    # Integration tests

  sdk-tests:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4 with: { java-version: "${{ env.JAVA_VERSION }}" }
      - run: ./gradlew :sdk:test

  dependency-audit:
    runs-on: ubuntu-latest
    steps:
      - run: cd backend && npm audit                    # npm vulnerabilities
```

## Agent Script Installation

```bash
# Run once per clone (documented in setup guide):
chmod +x scripts/agent scripts/verify-*.sh scripts/audit-violations.sh
ln -sf ../../scripts/pre-push-agent.sh   .git/hooks/pre-push
ln -sf ../../scripts/pre-commit-agent.sh .git/hooks/pre-commit
```

## Key Metrics

| Gate | Checks | Speed | Bypass | Who |
|------|--------|-------|--------|-----|
| pre-commit | 3 | <5s | `--no-verify` on commit | All devs |
| pre-push (Sentry) | 9 | ~10s | `--no-verify` on push | All devs |
| pre-push (Architect) | 24 | ~30s | `--no-verify` on push | All devs |
| pre-push (Compliance) | 23 | ~20s | `--no-verify` on push | All devs |
| CI lint | 5+ | ~2min | None | CI/CD |
| CI tests | 140+ | ~5min | None | CI/CD |
| CI audit | 18 | ~30s | None | CI/CD |

## Anti-Patterns

## Universal Rule Scanning (Required in Every Project)

Add scanning for the 4 universal rules as pre-commit hooks. These catch what agents miss.

### Pre-Commit Scan Script

```bash
#!/usr/bin/env bash
# scripts/scan-universal-rules.sh
# Language-agnostic. Works for JS, Kotlin, Python, Go, Rust, Swift.

LANGUAGES="--include=*.js --include=*.ts --include=*.kt --include=*.java"
LANGUAGES="$LANGUAGES --include=*.py --include=*.go --include=*.rs"
ERRORS=0

echo "🔍 Scanning for universal rule violations..."

# Rule 1: No console logging
if grep -rn "console\.log\|console\.debug\|console\.warn\|console\.error" \
    $LANGUAGES --exclude="*test*" --exclude="*spec*" src/ 2>/dev/null; then
    echo "❌ Rule 1: console.log found. Use structured logger."
    ((ERRORS++))
fi

# Rule 1b: No println in production code
if grep -rn "println\|print(" \
    --include=*.kt --include=*.java --include=*.py \
    --exclude="*test*" --exclude="*spec*" src/ 2>/dev/null; then
    echo "❌ Rule 1b: println/print found in production code."
    ((ERRORS++))
fi

# Rule 2: No hardcoded secrets
if grep -rn "sk_live_\|pk_live_\|AKIA\|ghp_\|ghs_" \
    $LANGUAGES --exclude="*.example" --exclude="*.md" src/ 2>/dev/null; then
    echo "❌ Rule 2: Hardcoded secret detected."
    ((ERRORS++))
fi

# Rule 2b: Run gitleaks if available
if command -v gitleaks &> /dev/null; then
    if ! gitleaks detect --source . --no-git --verbose 2>/dev/null; then
        echo "❌ Rule 2b: Gitleaks detected secrets."
        ((ERRORS++))
    fi
fi

# Rule 4b: No eval()
if grep -rn "eval(" --include=*.js --include=*.ts src/ 2>/dev/null; then
    echo "❌ Rule 4: eval() found. Use safe alternatives."
    ((ERRORS++))
fi

# Rule 4c: No Math.random() for security
if grep -rn "Math\.random(" --include=*.js --include=*.ts src/ 2>/dev/null; then
    echo "❌ Rule 4: Math.random() used. Use CSPRNG."
    ((ERRORS++))
fi

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo "❌ $ERRORS universal rule violation(s) found. See 01-FOUNDATION/03-universal-rules.md."
    exit 1
fi

echo "✅ All universal rules passed."
exit 0
```

### Integration

```
pre-commit hook chain:
  1. scan-universal-rules.sh   → ~2s, catches console.log, secrets, eval
  2. lint (eslint/ktlint)       → ~5s, catches style issues
  3. compile check              → ~30s, catches type errors

pre-push hook chain:
  1. pre-commit (all of above)
  2. agent @sentry              → 9 checks, ~10s
  3. agent @architect           → 24 checks, ~30s
  4. agent @compliance          → 23 checks, ~20s
  5. npm test                   → 140+ tests, ~2-5min
```

| Anti-Pattern | Fix |
|-------------|-----|
| Single git hook that runs everything | Split into pre-commit (fast) + pre-push (thorough) |
| CI is the ONLY check | Shift left: run checks locally before push |
| Agents have no bypass | Document `--no-verify` as emergency-only with required post-hoc justification |
| Hook scripts committed to `.git/hooks/` | Symlink from `scripts/` (per-clone setup) |
| Agent scripts without execute bit | `git update-index --chmod=+x` + verify with `git ls-files --stage` |
| CI tests require real infrastructure | Use Docker services for CI; mock adapters for local |
| No scan for console.log/secrets | Add `scan-universal-rules.sh` as pre-commit — catches what agents miss |
| Scanning only for one language | Language-agnostic grep patterns work for JS, Kotlin, Python, Go, Rust, Swift |
