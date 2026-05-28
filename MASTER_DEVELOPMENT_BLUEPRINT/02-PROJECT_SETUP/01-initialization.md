# Project Initialization

## The First 48 Hours

The first 48 hours of a project determine its engineering trajectory. Here's the exact sequence.

---

## Step 1: Define the Problem (2 hours)

Answer these questions in `01-FOUNDATION/01-problem-purpose.md`:

- **What problem are we solving?** (one sentence)
- **Who has this problem?** (target user)
- **Why does this need to exist?** (alternatives analysis)
- **What is NOT in scope?** (explicit boundaries — prevents scope creep)
- **What's the riskiest assumption?** (what must be true for this to work)

**Deliverable:** A single paragraph that passes the "elevator pitch" test.

---

## Step 2: Set the Boundaries (1 hour)

| Question | Answer | Impact |
|----------|--------|--------|
| Is this B2B, B2C, or both? | | Auth model, onboarding, billing |
| Does it handle money? | | PCI DSS, PSD3, financial regulations |
| Does it handle biometrics? | | BIPA, GDPR Art.9, jurisdiction checks |
| Does it handle minors? | | COPPA, GDPR Art.8, age verification |
| Is it a global product? | | GDPR (EU), CCPA (CA), PIPEDA (CA), LGPD (BR) |
| Target platforms? | | Web, iOS, Android, API-only |
| Do we need user accounts? | | Auth system, passwordless, SSO |

**Deliverable:** A scoping document that determines which sections of this blueprint are mandatory vs optional.

---

## Step 3: Choose the Stack (4 hours)

Use `02-PROJECT_SETUP/02-technology-selection.md` to systematically evaluate options.

**Decision process:**
1. What does the team already know? (velocity matters)
2. What does the ecosystem support? (libraries, tools, community)
3. What does the problem domain require? (performance, security, compliance)
4. What can the infrastructure handle? (budget, deployment, scaling)

**Deliverable:** Technology decision document with pros/cons for each choice.

---

## Step 4: Set Up Repository (2 hours)

Use `02-PROJECT_SETUP/03-repository-structure.md` to create the repo structure.

**Minimum files for day 1:**
```bash
.gitignore
README.md           # What, why, how to start
CLAUSE.md           # LLM agent context (if using LLMs)
AGENTS.md           # Tool-agnostic agent context
LICENSE
.editorconfig       # Consistent formatting across IDEs
.env.example        # All env vars with comments
```

**Deliverable:** A git repo with the skeleton structure, nothing else.

---

## Step 5: Define Configuration (2 hours)

Use `02-PROJECT_SETUP/04-configuration.md` to set up:
- Environment variable management
- Secret management strategy
- Feature flag system
- Environment hierarchy (dev/staging/prod)

**Deliverable:** Working `.env.example`, secrets access pattern, feature toggle system.

---

## Step 6: Document Architecture (4 hours)

Write `03-ARCHITECTURE/01-overview.md` with:
- System context diagram (text-based or tool-generated)
- Module decomposition
- Data flow diagrams
- Key security decisions
- Provider abstraction plan

**Deliverable:** Architecture document that a new developer can read in 30 minutes and understand the whole system.

---

## Step 7: Write the First Test (1 hour)

Before writing production code, write the first test that proves your toolchain works:

```javascript
describe('System Health', () => {
    it('should have all env vars configured', () => {
        expect(process.env.NODE_ENV).to.exist;
        expect(process.env.PORT).to.exist;
    });
});
```

**Deliverable:** A passing test suite that proves the development environment works.

---

## Step 8: Create the Pre-Push Gates (2 hours)

Set up the automation that will enforce quality:
1. Pre-commit hook (lint + format)
2. Pre-push hook (tests + security scan)
3. CI pipeline (full test suite + compilation)

**Reference:** `05-DEVELOPMENT/03-ci-cd.md`, `09-AUTOMATION_AGENTS/03-pre-push-gates.md`

**Deliverable:** Automated gates that prevent bad code from reaching production.

---

## Step 9: MVP Plan (2 hours)

Define the smallest thing that delivers value:
1. What is the minimal feature set? (must have)
2. What can wait? (nice to have)
3. What is explicitly excluded? (v2)

**Reference:** `08-PROJECT_MANAGEMENT/03-roadmap.md`

**Deliverable:** A phased roadmap with clear iteration boundaries.

---

## Step 10: Write the First Feature (remaining time)

Now you can write code. The entire foundation is in place:

- ✅ Purpose defined
- ✅ Stack selected
- ✅ Repo structured
- ✅ Config managed
- ✅ Architecture documented
- ✅ Tests working
- ✅ Gates automated
- ✅ Roadmap clear

## Checklist

```
□ Step 1: Problem defined and documented
□ Step 2: Scope boundaries set
□ Step 3: Stack selected with rationale
□ Step 4: Repository initialized with git
□ Step 5: Configuration system in place
□ Step 6: Architecture documented
□ Step 7: Test suite passing
□ Step 8: Pre-push gates installed
□ Step 9: MVP roadmap defined
□ Step 10: First feature started
```
