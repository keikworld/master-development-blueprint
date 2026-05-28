# Problem, Purpose & Objectives

## The Problem

Most software projects fail not because of bad ideas, but because of **engineering debt accumulation**:

1. **No foundational structure** — Projects start with code, not architecture. By week 8, the codebase is unmanageable.
2. **Security as an afterthought** — Added after breaches, not before. Retrofitting security costs 10x more.
3. **Compliance ignored until legal** — GDPR fines, PSD3 violations, BIPA lawsuits. Reactive compliance is expensive.
4. **No institutional memory** — Every new developer (or LLM agent) starts from zero. Mistakes repeat. Lessons are lost.
5. **LLM chaos** — AI agents generate code without context. They don't know your patterns, your security rules, or your architecture.
6. **Pivoting breaks everything** — Changing direction means rewriting, not refactoring. Months of work lost.

## Target Audience

| Role | Pain Point | How This Helps |
|------|-----------|----------------|
| **Founder / CTO** | "I need to ship fast but can't afford security breaches" | Decision framework, risk-based prioritization, MVP-to-production path |
| **Developer** | "I don't know the right way to structure this" | Patterns, templates, coding standards, module boundaries |
| **Security Engineer** | "I find the same vulnerabilities in every codebase" | Security patterns, compliance matrices, pentest checklists |
| **DevOps** | "Deployment is fragile and manual" | CI/CD templates, pre-push gates, provider abstraction |
| **LLM Agent** | "I don't know the project's conventions" | Structured context files, clear rules, verified import tables |
| **Compliance Officer** | "We have no documented data handling" | Data matrix templates, legal basis guides, retention policies |
| **Product Manager** | "How do we track progress meaningfully?" | Task tracking templates, roadmap structure, milestone definitions |

## Purpose

Create a **repeatable, modular development system** that:

1. **Eliminates decision fatigue** — Every pattern, technology choice, and workflow is pre-decided and documented
2. **Bakes in security** — Security is not a layer; it's the architecture. Constant-time, memory wiping, CSPRNG are default patterns
3. **Satisfies compliance by design** — GDPR, PSD3, BIPA, CCPA requirements are encoded into templates, not review steps
4. **Preserves context for AI** — LLM agents get structured context (CLAUDE.md pattern) so they generate correct code the first time
5. **Enables safe pivots** — Modular architecture with clean interfaces means changing direction doesn't mean rewriting everything
6. **Captures everything** — Every bug, every incident, every lesson learned becomes a permanent part of the blueprint

## Core Objectives

### Objective 1: Engineering Rigor
- Every module has defined boundaries and dependency rules
- Every external dependency has a documented rationale (with pros/cons research)
- Every function has a single responsibility
- Every API has versioning and backward compatibility

### Objective 2: Security by Default
- All digest comparisons are constant-time
- All secrets are memory-wiped after use
- All randomness uses CSPRNG
- All user data is minimized, anonymized, and time-limited
- All authentication has replay protection

### Objective 3: Compliance as Architecture
- Data handling matrix before any feature code
- Legal basis for every data point collected
- Automated compliance gates in CI/CD
- Privacy by design, not privacy as a review step

### Objective 4: LLM-Friendly
- Project context files (CLAUDE.md pattern) at root level
- Verified import tables (not assumptions)
- Clear "do not do" lists
- Step-by-step workflows for common tasks

### Objective 5: Pivot-Ready
- Provider abstraction for infrastructure (cache, database, secrets)
- Clean module boundaries with documented interfaces
- Business logic separated from framework code
- Feature flags for gradual rollout

## Key Questions (Who, When, How)

### Who
- **Who decides the architecture?** — The blueprint defines patterns; the team decides deviations
- **Who owns security?** — Every developer, but security engineers define the patterns
- **Who maintains the blueprint?** — A designated "architect" role or the founding team
- **Who enforces gates?** — Automated (pre-push hooks) + human (code review)

### When
- **When do we define the architecture?** — Before writing any production code (SCOPE phase)
- **When do we write the compliance matrix?** — Before writing code for each feature
- **When do we update the blueprint?** — After every incident, pattern change, or significant lesson
- **When do we pivot?** — Only when the architecture supports it (provider abstraction, clean modules)

### How
- **How do we select technology?** — Research matrix (pros/cons/evidence) → team decision → document rationale
- **How do we ensure quality?** — Automated gates (pre-push) + manual review (code review) + continuous testing
- **How do we onboard new team members?** — Read the blueprint → run the checklists → pair on first feature
- **How do we onboard LLM agents?** — Provide structured context file → verify output against gates → iterate

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Time to first feature | < 2 weeks from project start | Calendar time from init to first deployed feature |
| Security vulnerabilities in production | 0 critical/high | Incident tracking, pentest reports |
| Compliance violations detected | 0 (automated gates catch them) | Pre-push agent reports |
| LLM-generated code acceptance rate | > 80% first-pass | Code review stats |
| Pivot cost | < 2 weeks for full direction change | Measured against module boundaries |
| Duplicate incidents | 0 (every lesson prevents repeat) | Incident vs lesson cross-reference |
