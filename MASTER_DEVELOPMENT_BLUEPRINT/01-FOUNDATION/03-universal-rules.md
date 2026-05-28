# Universal Rules (Language-Agnostic Core)

## What These Are

The rules in this file apply to **every project, in every language, on every platform.** Kotlin, JavaScript, Python, Go, Rust, Swift — doesn't matter. These are non-negotiable.

The code examples use Kotlin and JavaScript because those are the blueprint's source languages, but the RULE is language-agnostic. Adapt the implementation to your stack.

---

## Rule 1: No Console Logging (Structured Logger Only)

### ❌ Forbidden

```javascript
console.log('User logged in:', userId);          // PII leak!
console.log('Token:', token);                     // Secret leak!
console.log('Error:', error.message);             // May expose internals!
console.log('Request body:', req.body);           // Full data leak!
console.log(userInput);                           // Untrusted data in logs!
```

```kotlin
println("User logged in: $userId")                // PII leak!
println("Debug: $sensitiveData")                  // No!
```

### ✅ Required: Structured Logger with Auto-Redaction

```javascript
// Node.js — structured logger (pino, winston, or custom)
const logger = require('./utils/logger');

logger.info('User auth event', {
    event: 'login_success',
    uuid: privacyUtils.hashDeviceId(userId),   // Hashed, not raw
    timestamp: Date.now()
    // NEVER: userId, token, password, raw input
});

// The logger auto-redacts known PII fields
// Config: redact: ['password', 'token', 'secret', 'ssn', 'email']
```

```kotlin
// Kotlin — structured logger
logger.info("User auth event") {
    with("event" to "login_success")
    with("uuid" to privacyUtils.hashDeviceId(userId))
    // NEVER include raw identifiers
}
```

### Why It Matters

| What Happens | Consequence |
|-------------|-------------|
| PII in logs | GDPR fine up to €20M or 4% of revenue |
| Secrets in logs | Attacker reads logs → steals keys → full system compromise |
| User data in logs | Data breach disclosure required |
| `console.log` in production | No redaction, no structure, can't search |

### What To Log vs What NOT To Log

| ✅ Log This | ❌ Never Log This |
|------------|-------------------|
| Event type (`login_attempt`, `payment_completed`) | Raw user identifiers (email, phone, SSN) |
| Hashed/anonymized IDs (`hashDeviceId(uuid)`) | Tokens, passwords, secrets |
| Status codes (200, 403, 500) | Request/response bodies |
| Duration, size, metadata | Stack traces with user data |
| Error types (`VALIDATION_ERROR`, `RATE_LIMIT_EXCEEDED`) | Full error messages from 3rd parties |

### Enforcement

```bash
# Pre-commit: scan for console.log
grep -rn "console\.log\|console\.debug\|console\.warn\|console\.error" src/ --include="*.js" --include="*.ts"
# Exit code 1 if any found → BLOCK

# Also scan for println in production code
grep -rn "println\|print(" src/ --include="*.kt" --include="*.java"
```

### Examples Per Language

| Language | ❌ Wrong | ✅ Right |
|----------|---------|----------|
| Node.js | `console.log(data)` | `logger.info('event', { safe })` |
| Kotlin | `println(userId)` | `logger.info { with("sid" to hash(id)) }` |
| Python | `print(f"User: {email}")` | `logging.info("event", extra={"sid": hash(id)})` |
| Go | `fmt.Println(token)` | `slog.Info("event", "sid", hash(id))` |
| Rust | `println!("{}", secret)` | `info!("event"; "sid" => hash(id))` |
| Swift | `print(userData)` | `os_log("event", hash(id))` |

---

## Rule 2: No Hardcoded Secrets

### ❌ Forbidden

```javascript
// NEVER in source code:
const API_KEY = 'sk_live_abc123xyz';                 // Secret in code!
const DB_PASSWORD = 'password123';                    // Credential in code!
const JWT_SECRET = 'my-super-secret-key';             // Crypto key in code!
const AWS_ACCESS_KEY = 'AKIAIOSFODNN7EXAMPLE';        // Cloud key in code!
```

```kotlin
// NEVER in source code:
private const val API_SECRET = "my-secret-key"        // Secret in code!
```

```python
# NEVER in source code:
API_TOKEN = "ghp_abc123def456"                        # GitHub token in code!
```

### ✅ Required: Environment Variables + Config

```javascript
// config/secrets.js — centralized secret management
class Secrets {
    get(key) {
        const value = process.env[key];
        if (!value) {
            throw new Error(`Required secret not set: ${key}`);
        }
        return value;
    }
}

const secrets = new Secrets();

// Usage — never access process.env directly
const apiKey = secrets.get('STRIPE_API_KEY');
const jwtSecret = secrets.get('JWT_SECRET');
```

```kotlin
// Config object, loaded from env at startup
object AppConfig {
    val jwtSecret: String by lazy {
        System.getenv("JWT_SECRET")
            ?: throw IllegalStateException("JWT_SECRET not set")
    }
}
```

### .env File Rules

```
# .env.example — committed to repo (example values only)
# This is a TEMPLATE. Never put real values here.
JWT_SECRET=change-me-in-production
STRIPE_API_KEY=pk_example_key
DB_PASSWORD=replace_with_real_password

# .env — gitignored (real values)
JWT_SECRET=aB3dE5fG7hIjKlMnOpQrStUvWxYz1234
STRIPE_API_KEY=sk_live_abc123xyz

# .env.local — gitignored (local overrides)
# Overrides .env for local development
DB_PASSWORD=local_dev_password
```

### Detection Checklist

- [ ] No hardcoded strings matching `sk_live_`, `pk_live_`, `AKIA`, `ghp_`, `ghs_` patterns
- [ ] No secrets in source control (`gitleaks`, `truffleHog`, or `git secrets` installed)
- [ ] All config via env vars or config service (KMS, Vault, AWS Secrets Manager)
- [ ] `.env.example` is the ONLY committed env file
- [ ] `.env`, `.env.local`, `*.key`, `cert*.pem` in `.gitignore`

---

## Rule 3: Everything In Variables (No Magic Numbers/Strings)

### ❌ Forbidden

```javascript
// Magic numbers — what does 86400 mean?
setTimeout(() => retry(), 86400);

// Magic strings — what does 'v3' mean?
if (user.level === 'v3') { grantAccess(); }

// Hardcoded limits in business logic
if (attempts > 5) { lockAccount(); }

// Hardcoded paths
fs.readFile('/var/data/users.json');
```

### ✅ Required: Named Constants in Config

```javascript
// config/constants.js — single source of truth
module.exports = {
    // Timeouts (in milliseconds — always document the unit)
    RETRY_INTERVAL_MS: 200,
    SESSION_TTL_MS: 24 * 60 * 60 * 1000,           // 24 hours
    RATE_LIMIT_WINDOW_MS: 60 * 1000,                 // 1 minute
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MS: 15 * 60 * 1000,             // 15 minutes
    TOKEN_EXPIRY_MS: 15 * 60 * 1000,                 // 15 minutes
    REFRESH_TOKEN_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000, // 7 days

    // Limits
    MAX_INPUT_SIZE_BYTES: 1024 * 10,                  // 10KB
    MAX_PIN_LENGTH: 8,
    MAX_FACTORS_PER_USER: 15,

    // Paths
    DATA_DIR: process.env.DATA_DIR || './data',
    LOG_DIR: process.env.LOG_DIR || './logs',

    // Feature flags (from env, with defaults)
    FEATURE_NEW_UI: process.env.FEATURE_NEW_UI === 'true',
};

// Usage — never hardcode
const { MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MS } = require('./config/constants');

if (attempts >= MAX_LOGIN_ATTEMPTS) {
    await lockAccount(accountId, LOCKOUT_DURATION_MS);
}
```

```kotlin
// Config.kt — single source of truth
object AppConstants {
    const val RETRY_INTERVAL_MS = 200L
    const val SESSION_TTL_MS = 24 * 60 * 60 * 1000L
    const val MAX_LOGIN_ATTEMPTS = 5
    const val LOCKOUT_DURATION_MS = 15 * 60 * 1000L
    const val MAX_INPUT_SIZE_BYTES = 1024 * 10
}

// Usage
if (attempts >= AppConstants.MAX_LOGIN_ATTEMPTS) {
    lockAccount(accountId, AppConstants.LOCKOUT_DURATION_MS)
}
```

### The "Always Update That File" Rule

If you change a constant, **update the config/constants file** — not just the one place you're using it. This means:

1. Every magic number/string has ONE home in a config/constants file
2. Every reference to that value uses the constant, not a literal
3. When the value needs to change, you change it in ONE place
4. Code review catches: "you hardcoded a timeout here instead of using the constant"

### Scanning for Violations

```bash
# Find magic numbers (to review, not auto-block — some are valid)
grep -rn "[0-9]\{4,\}" src/ --include="*.js" --include="*.kt"
# Flags anything with 4+ consecutive digits for review

# Find hardcoded paths
grep -rn "\/var\/\|\/etc\/\|\/usr\/" src/ --include="*.js"

# Find magic strings (potential hardcoded config)
grep -rn "=='[a-z_]\{1,\}'" src/ --include="*.js"
```

---

## Rule 4: Always Scan For Violations (Automated)

### What To Scan

| Scan | What It Catches | Tool |
|------|----------------|------|
| Console logging | `console.log`, `println`, `print` in production code | `grep` / custom script |
| Hardcoded secrets | API keys, tokens, passwords in source | `gitleaks` / `trufflehog` / `git secrets` |
| Hardcoded paths | `/var/`, `/etc/`, `/usr/` paths in code | Custom `grep` |
| Deprecated/forbidden functions | `eval()`, `Math.random()` for security, `contentEquals()` | Custom script |
| PII in logs — manual review | Human review of log statements | Code review rule |
| Dependency vulnerabilities | Known CVEs in npm/pip/go/maven packages | `npm audit`, `pip audit`, `trivy`, `owasp dependency-check` |

### Pre-Commit Hook (Runs Every Commit)

```bash
#!/usr/bin/env bash
# scripts/scan-violations.sh
# Non-negotiable: BLOCKS commit on any violation

ERRORS=0

# 1. Scan for console.log in source
if grep -rn "console\.log\|console\.debug\|console\.warn\|console\.error" \
    --include="*.js" --include="*.ts" src/ 2>/dev/null; then
    echo "❌ BLOCKED: console.log found in source code. Use structured logger."
    ((ERRORS++))
fi

# 2. Scan for println in production code
if grep -rn "println\|print(" \
    --include="*.kt" --include="*.java" \
    --exclude="*Test*" --exclude="*test*" src/ 2>/dev/null; then
    echo "❌ BLOCKED: println found in production code. Use structured logger."
    ((ERRORS++))
fi

# 3. Scan for hardcoded secrets patterns (false positives possible, review each)
if grep -rn "sk_live_\|pk_live_\|AKIA\|ghp_\|ghs_\|gho_\|ghu_\|ghr_" \
    --include="*.js" --include="*.kt" --include="*.py" --include="*.ts" \
    --exclude="*.example" src/ 2>/dev/null; then
    echo "❌ BLOCKED: Hardcoded secret detected in source code."
    ((ERRORS++))
fi

# 4. Scan for forbidden functions
if grep -rn "Math\.random(" \
    --include="*.js" --include="*.ts" src/ 2>/dev/null; then
    echo "❌ BLOCKED: Math.random() used. Use crypto.randomBytes() / SecureRandom."
    ((ERRORS++))
fi

if grep -rn "\.contentEquals\(" \
    --include="*.kt" --include="*.java" src/ 2>/dev/null; then
    echo "❌ BLOCKED: contentEquals() used. Use ConstantTime.equals()."
    ((ERRORS++))
fi

if grep -rn "eval(" \
    --include="*.js" --include="*.ts" src/ 2>/dev/null; then
    echo "❌ BLOCKED: eval() used. Use safe alternatives."
    ((ERRORS++))
fi

# 5. Scan for hardcoded IP addresses
if grep -rn "[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}" \
    --include="*.js" --include="*.kt" src/ \
    --exclude="*.example" --exclude="*test*" 2>/dev/null; then
    echo "⚠️  WARNING: Hardcoded IP addresses in source. Use config."
    # Don't block on IPs (some may be valid defaults like 127.0.0.1)
fi

# Exit
if [ $ERRORS -gt 0 ]; then
    echo "❌ $ERRORS violation(s) found. Commit blocked."
    exit 1
fi

echo "✅ No violations found."
exit 0
```

## Rule 5: Always Scan Dependencies for Vulnerabilities

### Why

Your code can be perfect — but a vulnerable dependency (log4shell, event-stream, eslint-scope) compromises your entire system. Dependency scanning is non-negotiable because:

- **Transitive dependencies** — You don't choose them, but they can break you
- **Zero-day disclosure** — When a CVE drops, you need to know within hours if you're affected
- **Regulatory requirement** — PCI-DSS, SOC 2, and FedRAMP all require dependency scanning

### Per Language

| Language | Lock File | Scan Command | Frequency |
|----------|-----------|-------------|-----------|
| Node.js | `package-lock.json` | `npm audit` | Every CI run + weekly scheduled |
| Python | `requirements.txt` / `poetry.lock` | `pip-audit` / `safety check` | Every CI run |
| Go | `go.sum` | `govulncheck ./...` | Every CI run |
| Rust | `Cargo.lock` | `cargo audit` | Every CI run |
| Java/Kotlin | `build.gradle` / `pom.xml` | `owasp dependency-check` / `gradle dependencyCheckAnalyze` | Every CI run |
| Docker | `Dockerfile` | `trivy image` | Weekly + on base image change |

### CI Integration

```yaml
# .github/workflows/dependency-scan.yml
name: Dependency Scan
on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 9 * * 1'  # Every Monday 9 AM UTC

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Scan npm dependencies
        run: |
          cd backend
          npm audit --audit-level=high
        continue-on-error: true  # Don't block CI on warnings, but alert

      - name: Scan with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'table'
          exit-code: '1'
          severity: 'HIGH,CRITICAL'

      - name: Notify on critical vulnerabilities
        if: failure()
        run: |
          echo "⚠️ CRITICAL: Dependency vulnerabilities found!"
          echo "Run: cd backend && npm audit"
```

### Pre-Push Quick Check

```bash
# Fast pre-push check — warns about high/critical vulns
case "$LANG" in
  node)
    npm audit --audit-level=high
    ;;
  python)
    pip-audit --desc on
    ;;
  go)
    govulncheck ./...
    ;;
  rust)
    cargo audit
    ;;
  java|kotlin)
    ./gradlew dependencyCheckAnalyze
    ;;
esac
```

### Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| `npm audit` only before release | Run on EVERY push + weekly scheduled scan |
| Ignore `npm audit` warnings (too many) | Set `--audit-level=high` to focus on actionable |
| No scanning for transitive deps | Trivy scans filesystem for all lock files |
| Scan only one language's deps | If you use multiple ecosystems (Node + Python + Docker), scan ALL |
| `continue-on-error: true` but nobody checks | Send alerts to Slack/email on failure |

---

### Pre-Push: Full Security Scan

```bash
# Install gitleaks (once)
# brew install gitleaks  # macOS
# or download from https://github.com/gitleaks/gitleaks

# Run before push
gitleaks detect --source . --verbose

# Or use git secrets (if gitleaks is too heavy for your project)
# git secrets --scan
```

---

## Summary: The 5 Universal Rules

| # | Rule | Enforcement | Severity |
|---|------|-------------|----------|
| 1 | No console.log (structured logger only) | Pre-commit grep | ❌ Hard block |
| 2 | No hardcoded secrets | Pre-commit grep + gitleaks | ❌ Hard block |
| 3 | Everything in variables (config/constants) | Code review + grep | ⚠️ Strong warn |
| 4 | Always scan for violations | Pre-commit + pre-push hooks | ❌ Hard block |
| 5 | Always scan dependencies for vulnerabilities | `npm audit` / `pip-audit` / `trivy` — every push + weekly | ❌ Hard block (critical) |

**Language doesn't change these rules.** Whether you write Kotlin, JavaScript, Python, Go, Rust, or Swift, these 5 rules apply identically. Only the syntax of the enforcement script changes.
