#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# blueprint init.sh — Starter Project Scaffold
# =============================================================================
# Creates a new project following the Master Development Blueprint structure.
# Run from anywhere:  bash /path/to/blueprint/init.sh
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BLUEPRINT_DIR="$SCRIPT_DIR/MASTER_DEVELOPMENT_BLUEPRINT"

echo "========================================================================="
echo " Blueprint Project Initializer"
echo " Creates a starter project following the Master Development Blueprint."
echo "========================================================================="

# ---- Gather Input ----
echo ""

read -r -p "Project name (e.g., my-api): " PROJECT_NAME
[ -z "$PROJECT_NAME" ] && { echo "Project name required"; exit 1; }

read -r -p "Description: " PROJECT_DESC
[ -z "$PROJECT_DESC" ] && PROJECT_DESC="A well-engineered project"

echo ""
echo "Project types:"
echo "  1) web-api     — REST API with Express/FastAPI/Spring"
echo "  2) cli-tool    — Command-line tool"
echo "  3) kmp-library — Kotlin Multiplatform library"
echo "  4) web-app     — Frontend web application"
echo "  5) other       — Custom / don't know yet"
echo ""
read -r -p "Type (1-5, default 1): " TYPE_NUM
case "${TYPE_NUM:-1}" in
  1) PROJECT_TYPE="web-api" ;;
  2) PROJECT_TYPE="cli-tool" ;;
  3) PROJECT_TYPE="kmp-library" ;;
  4) PROJECT_TYPE="web-app" ;;
  5) PROJECT_TYPE="other" ;;
  *) PROJECT_TYPE="web-api" ;;
esac

read -r -p "Language (Node.js / Python / Go / Rust / Kotlin / other): " LANG
[ -z "$LANG" ] && LANG="Node.js"

read -r -p "Package manager (npm / pip / cargo / go mod / gradle): " PKG_MGR
[ -z "$PKG_MGR" ] && PKG_MGR="npm"

# ---- Create Project ----
TARGET_DIR="$(pwd)/$PROJECT_NAME"
if [ -d "$TARGET_DIR" ]; then
  echo ""
  echo "  Directory '$PROJECT_NAME' already exists."
  read -r -p "  Overwrite? (y/N): " OVERWRITE
  [ "$OVERWRITE" != "y" ] && { echo "  Aborted."; exit 1; }
fi

echo ""
echo "  Creating project: $PROJECT_NAME ($PROJECT_TYPE / $LANG)..."
echo ""

mkdir -p "$TARGET_DIR"

# ---- .gitignore ----
cat > "$TARGET_DIR/.gitignore" <<GITIGNORE
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment
.env
.env.local
.env.production

# Build
dist/
build/
target/
out/
*.class
*.jar
*.pyc

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Secrets
**/secrets/
**/credentials/
GITIGNORE
echo "  [done] .gitignore"

# ---- .env.example ----
cat > "$TARGET_DIR/.env.example" <<ENV
# Project: $PROJECT_NAME
# Description: $PROJECT_DESC
# Type: $PROJECT_TYPE

# Server
PORT=3000
NODE_ENV=development

# Never commit real values here. This is a template.
# Copy to .env and fill in your values.

# DATABASE_URL=postgresql://user:password@localhost:5432/db
# REDIS_URL=redis://localhost:6379
# API_KEY=change-me
ENV
echo "  [done] .env.example"

# ---- README.md ----
cat > "$TARGET_DIR/README.md" <<README
# $PROJECT_NAME

$PROJECT_DESC

## Overview

This project was initialized with the Master Development Blueprint.

## Quick Start

\`\`\`bash
# Install dependencies
$PKG_MGR install

# Copy environment vars
cp .env.example .env

# Start development
$PKG_MGR run dev
\`\`\`

## Policies

See \`policies/\` directory for governance policies (created during Phase 2 of the blueprint process).

## Project Structure

\`\`\`
src/           # Source code
tests/         # Tests
policies/      # Governance policies
docs/          # Documentation
scripts/       # Automation scripts
\`\`\`

## Blueprint Process

This project follows the 8-phase Master Development Blueprint:

1. **Discovery** — Understand the project requirements
2. **Policy Creation** — Create DATA, SECURITY, COMPLIANCE, PRIVACY policies
3. **Pattern Matching** — Map to architectural patterns
4. **Decision Trees** — Evaluate tradeoffs
5. **Governance + Approval** — Risk assessment, sign-offs
6. **Anti-Patterns** — Resolve known issues before coding
7. **Implementation** — Tests first, then code
8. **Validation** — Check against rules

Send the contents of this repo to an LLM with the instruction:
\`Read MASTER_DEVELOPMENT_BLUEPRINT/00-USE-WITH-ANY-LLM.md first, then start the discovery phase.\`
README
echo "  [done] README.md"

# ---- Directories ----
mkdir -p "$TARGET_DIR/src"
mkdir -p "$TARGET_DIR/tests"
mkdir -p "$TARGET_DIR/policies"
mkdir -p "$TARGET_DIR/docs"
mkdir -p "$TARGET_DIR/scripts"

# ---- Starter Source File ----
case "$PROJECT_TYPE" in
  web-api)
    mkdir -p "$TARGET_DIR/src/routes"
    mkdir -p "$TARGET_DIR/src/services"
    mkdir -p "$TARGET_DIR/src/middleware"
    cat > "$TARGET_DIR/src/index.js" <<SRC
// $PROJECT_NAME — $PROJECT_DESC
//
// Start here. Run with: $PKG_MGR run dev
//
// Phase 1 rule: NO console.log — use structured logger
// Phase 2: Create policies in policies/ before writing real code
// Phase 5: Risk assessment must be approved before implementation

const PORT = process.env.PORT || 3000;

// TODO: Replace with structured logger (Phase 1, Universal Rule 1)
console.log("Server starting on port", PORT);
// ^-- Temporary. See 01-FOUNDATION/03-universal-rules.md
SRC
    ;;
  cli-tool)
    cat > "$TARGET_DIR/src/index.js" <<SRC
#!/usr/bin/env node
// $PROJECT_NAME — $PROJECT_DESC
//
// CLI entry point.

const main = async () => {
  const args = process.argv.slice(2);
  console.log("Hello from $PROJECT_NAME", args);
};

main().catch(console.error);
SRC
    chmod +x "$TARGET_DIR/src/index.js"
    ;;
  kmp-library)
    mkdir -p "$TARGET_DIR/src/commonMain/kotlin"
    mkdir -p "$TARGET_DIR/src/commonTest/kotlin"
    mkdir -p "$TARGET_DIR/src/androidMain/kotlin"
    mkdir -p "$TARGET_DIR/src/jsMain/kotlin"
    cat > "$TARGET_DIR/build.gradle.kts" <<GRADLE
plugins {
    kotlin("multiplatform") version "2.0.0"
    id("maven-publish")
}

kotlin {
    jvm()
    js(IR) { browser() }
    androidTarget()
}
GRADLE
    echo "  [done] build.gradle.kts"
    ;;
esac

# ---- Starter Test ----
cat > "$TARGET_DIR/tests/placeholder.test.js" <<TEST
// Placeholder test file.
// Phase 7 rule: Write tests BEFORE implementation.
// Replace this with real tests for your first feature.

describe("$PROJECT_NAME", () => {
  it("loads without errors", () => {
    // TODO: write real tests
    expect(true).toBe(true);
  });
});
TEST
echo "  [done] tests/placeholder.test.js"

# ---- Policy Templates ----
cat > "$TARGET_DIR/policies/DATA_POLICY.md" <<'POLICY'
# DATA_POLICY

**Status:** PENDING (created during Phase 2 of blueprint process)

## Data Inventory

| Field | Source | Format | Stored? | Location | Encryption | TTL | Legal Basis |
|-------|--------|--------|---------|----------|------------|-----|-------------|
| | | | | | | | |

## Minimization

What data is NOT collected (explicit exclusions):

## Retention

Default TTL for all stored data:

## Cleanup

Job name / schedule / behavior:
POLICY
echo "  [done] policies/DATA_POLICY.md"

cat > "$TARGET_DIR/policies/SECURITY_POLICY.md" <<'POLICY'
# SECURITY_POLICY

**Status:** PENDING (created during Phase 2 of blueprint process)

## Authentication

Method / tokens / sessions / MFA:

## Authorization

Role model / permissions / ownership checks:

## Encryption

At rest / in transit / algorithm choices:

## Secrets

Where they live / rotation schedule / access control:

## Vulnerability Handling

Reporting / SLA / patching process:
POLICY
echo "  [done] policies/SECURITY_POLICY.md"

cat > "$TARGET_DIR/policies/COMPLIANCE_POLICY.md" <<'POLICY'
# COMPLIANCE_POLICY

**Status:** PENDING (created during Phase 2 of blueprint process)

## Regulations

Applicable regulations (GDPR / CCPA / SOC2 / PCI-DSS / HIPAA / PSD3):

## Jurisdictions

Where users are / where data is stored / where servers run:

## Audit Trail

What events are logged / retention / access:

## Data Subject Rights

Deletion requests / access requests / portability:
POLICY
echo "  [done] policies/COMPLIANCE_POLICY.md"

cat > "$TARGET_DIR/policies/PRIVACY_POLICY.md" <<'POLICY'
# PRIVACY_POLICY

**Status:** PENDING (created during Phase 2 of blueprint process)

## PII Inventory

All personally identifiable information collected:

## Anonymization

Hashing / salting / aggregation methods:

## Sharing

Third parties / processors / data sharing agreements:

## Consent

How obtained / stored / revoked:
POLICY
echo "  [done] policies/PRIVACY_POLICY.md"

# ---- SESSION_CONTEXT.md (LLM Memory) ----
cat > "$TARGET_DIR/SESSION_CONTEXT.md" <<SESSION
# SESSION_CONTEXT.md
# Started: $(date +%Y-%m-%d) HH:MM UTC
# Project: $PROJECT_NAME

## Current Phase: 1-Discovery (not started)

## Completed Phases
- [ ] Phase 1 — Discovery
- [ ] Phase 2 — Policies
- [ ] Phase 3 — Pattern Matching
- [ ] Phase 4 — Decisions
- [ ] Phase 5 — Risk + Approvals
- [ ] Phase 6 — Anti-Patterns
- [ ] Phase 7 — Code
- [ ] Phase 8 — Validation

## Project Profile
- Type: $PROJECT_TYPE
- Language: $LANG
- Description: $PROJECT_DESC

## Key Decisions
(none yet — create during Phase 4)

## Open Questions
(none yet — capture during Discovery)

## Current Blockers
(none)
SESSION
echo "  [done] SESSION_CONTEXT.md"

# ---- CLAUDE.md / AI Instructions ----
cat > "$TARGET_DIR/CLAUDE.md" <<CLAUDE
# $PROJECT_NAME — AI Agent Instructions

## Project Context
$PROJECT_DESC
Language: $LANG
Type: $PROJECT_TYPE

## Policies (read before writing code)
See policies/ directory for governance policies.
All code changes require:
1. Risk assessment (data handling, security, compliance, privacy)
2. Tests (pre-merge gate — no test = no merge)
3. Documentation update (in same commit)

## Universal Rules (Never Violate)
1. NO console.log — use structured logger with auto-redaction
2. NO hardcoded secrets — all via env vars
3. NO magic numbers — everything in variables
4. ALWAYS scan for violations (grep + gitleaks)
5. ALWAYS scan dependencies (npm audit / equivalent)

## Commit Requirements
- Add Co-authored-by: for paired work
- Update docs in same commit as code
- Tests pass before push

## Related Documentation
- Master Development Blueprint: https://github.com/keikworld/master-development-blueprint
CLAUDE
echo "  [done] CLAUDE.md"

# ---- .env placeholder for development ----
cp "$TARGET_DIR/.env.example" "$TARGET_DIR/.env"

# ---- Initialize Git ----
cd "$TARGET_DIR"
git init
git add -A
git commit -m "chore: initial scaffold from Master Development Blueprint

Project: $PROJECT_NAME
Type: $PROJECT_TYPE
Language: $LANG

Created with blueprint init.sh — follow the 8-phase process
to develop this project (see README.md for instructions)." 2>/dev/null

echo ""
echo "========================================================================="
echo " Project '$PROJECT_NAME' created at:"
echo "   $TARGET_DIR"
echo ""
echo " Next steps:"
echo "   1. cd $PROJECT_NAME"
echo "   2. Review and customize the starter files"
echo "   3. Send this project to an LLM with:"
echo ""
echo "      'Read MASTER_DEVELOPMENT_BLUEPRINT/00-USE-WITH-ANY-LLM.md"
echo "       first, then read my project files and start the"
echo "       discovery phase.'"
echo ""
echo "   4. The LLM will guide you through all 8 phases."
echo "========================================================================="
