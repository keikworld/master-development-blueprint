# Master Development Blueprint

A comprehensive, modular blueprint for building well-engineered software projects — extracted from the production battle-testing of the NoTap authentication system.

**Purpose:** Single source of truth for founders, developers, and LLM agents to ship secure, compliant, and well-architected products.

### ⚠️ Important: This is a Guide, Not a Recipe to Follow Blindly

**Not every section applies to every project.** This blueprint captures patterns from a real production system. If you're building a simple CRUD API, you need the universal rules (no console.log, no hardcoded secrets) but probably not 3-tier rate limiting or zero-knowledge proofs.

**The LLM is trained to discriminate** — it picks the patterns that fit YOUR project and skips what doesn't. If you're a beginner, just tell the LLM what you're building and it guides you through only the relevant parts.

**Think of this as a cookbook, not a single recipe.** You pick what you need.

## How to Use

| Goal | Start With |
|------|-----------|
| **Build a project this weekend** | `WEEKEND_PROJECT.md` — zero to deployed in 2 days (with deploy templates in `MASTER_DEVELOPMENT_BLUEPRINT/scripts/deploy/`) |
| **Fork this repo for your own use** | `FORK_AND_RUN.md` — 3 options (template, init.sh, or contribute) |
| **Let an LLM guide you** | `init.sh` → then give it to any LLM with `00-USE-WITH-ANY-LLM.md` |
| **Founder starting a new product** | `01-FOUNDATION/01-problem-purpose.md` → `11-CHECKLISTS/01-new-project.md` |
| **Developer building features** | `02-PROJECT_SETUP/` → `03-ARCHITECTURE/` → `05-DEVELOPMENT/` |
| **Security Engineer** | `04-SECURITY/` → `11-CHECKLISTS/03-security-release.md` |
| **DevOps** | `06-INFRASTRUCTURE/` → `09-AUTOMATION_AGENTS/` |
| **LLM Agent (non-interactive)** | Give it `00-USE-WITH-ANY-LLM.md` — runs discovery through validation |
| **Pivoting Project** | `11-CHECKLISTS/04-pivot-checklist.md` + `12-APPENDIX/01-notap-reference.md` |
| **Contribute back** | `CONTRIBUTING.md` — add patterns, fix docs, share lessons |

## Quick Start: Weekend Project

```bash
bash init.sh                 # 2-minute interactive setup
cd YOUR-PROJECT
git push                     # Push to your own repo
# Give it to any LLM with:
# "Read FORK_AND_RUN.md first, then WEEKEND_PROJECT.md,
#  then MASTER_DEVELOPMENT_BLUEPRINT/00-USE-WITH-ANY-LLM.md"
```

See `WEEKEND_PROJECT.md` for the full Saturday-to-Sunday schedule.

## Quick Start: Serious Project

```bash
bash init.sh
cd YOUR-PROJECT
# Give to any LLM with:
# "Read MASTER_DEVELOPMENT_BLUEPRINT/00-USE-WITH-ANY-LLM.md first,
#  then start the discovery phase."
```

The LLM runs all 8 phases: Discovery -> Policies -> Patterns -> Decisions -> Risk + Approvals -> Anti-Patterns -> Tests-first Code -> Validation.

## Contents

| Section | What's Inside |
|---------|--------------|
| **01-FOUNDATION/** | Problem, philosophy, 10 engineering principles |
| **02-PROJECT_SETUP/** | Tech selection (web-researched), repo structure, config, env vars, project-type presets |
| **03-ARCHITECTURE/** | System design, API design, provider abstraction, processing pipeline |
| **04-SECURITY/** | Auth, crypto, data protection, compliance, input validation (5-layer), memory wiping, pentesting agent |
| **05-DEVELOPMENT/** | Coding standards, testing strategy (tests-first), CI/CD, feature flags |
| **06-INFRASTRUCTURE/** | Deployment, Docker, CI automation (56 pre-push gates), 3-tier rate limiting, retry pattern |
| **scripts/deploy/** | Quick-deploy templates: Dockerfile, railway.json, fly.toml |
| **08-PROJECT_MANAGEMENT/** | Planning files, roadmap, version strategy |
| **09-AUTOMATION_AGENTS/** | Multi-agent orchestration, watchdog + disposition system |
| **10-LESSONS_LEARNED/** | Architecture, security, and process lessons — read FIRST before any code |
| **11-CHECKLISTS/** | Policy creation, governance records, documentation matrix, new project, new feature, security release, daily dev |
| **12-APPENDIX/** | NoTap reference, tech comparison matrix, **runnable Express example (33 tests)**, community tools catalog |

## Community & Support

| Resource | Where |
|----------|-------|
| **Report issues** | [GitHub Issues](https://github.com/keikworld/master-development-blueprint/issues) |
| **Suggest patterns** | Use the "Suggest a Pattern" issue template |
| **Share lessons** | Use the "Share a Lesson" issue template |
| **Show your project** | `COMMUNITY_PROJECTS.md` — open a PR to add yours |
| **Contribute** | `CONTRIBUTING.md` — patterns, presets, examples, fixes |
| **Code of Conduct** | `CODE_OF_CONDUCT.md` — ethical use, do-no-harm, inclusive community |
| **Ask questions** | [GitHub Discussions](https://github.com/keikworld/master-development-blueprint/discussions) (coming soon) |

## Origin

Distilled from a production fintech authentication system that battle-tested these patterns in production. The blueprint documents the universal patterns — not the internals of any specific product.
