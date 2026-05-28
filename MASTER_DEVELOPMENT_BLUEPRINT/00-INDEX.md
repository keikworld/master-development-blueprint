# Master Index

## ⚠️ Before You Read: This is a Guide, Not a Rigid Template

**You don't need to read everything in this blueprint.** Not every section applies to every project. A simple API doesn't need 3-tier rate limiting. A static site doesn't need input validation pipelines. The LLM will guide you to the right sections.

**For beginners:** You don't need to read this file at all. Just tell the LLM what you're building and it handles the rest. See `00-USE-WITH-ANY-LLM.md` for the beginner-friendly walkthrough.

**For experienced developers:** Use this index to find the sections you need. The LLM will still guide you, but you can skip ahead if you know what you're looking for.

## Cross-Reference Map

Use this index to navigate between related topics across sections.

---

## Universal (Language-Agnostic)

| Topic | Primary | Related | Also See |
|-------|---------|---------|----------|
| Project-type presets | `02-PROJECT_SETUP/06-project-type-presets` | `00-USE-WITH-ANY-LLM` (Phase 3) | `02-PROJECT_SETUP/03-repository-structure` |
| Universal rules | `01-FOUNDATION/03-universal-rules` | `06-INFRASTRUCTURE/02-ci-automation` | `10-LESSONS_LEARNED/*` |
| Logging discipline | `01-FOUNDATION/03-universal-rules` (Rule 1) | `04-SECURITY/08-memory-wiping` | `10-LESSONS_LEARNED/02-security` |
| Secrets management | `01-FOUNDATION/03-universal-rules` (Rule 2) | `02-PROJECT_SETUP/04-configuration` | `04-SECURITY/03-cryptography` |
| Config constants | `01-FOUNDATION/03-universal-rules` (Rule 3) | `02-PROJECT_SETUP/04-configuration` | `05-DEVELOPMENT/01-coding-standards` |
| Violation scanning | `01-FOUNDATION/03-universal-rules` (Rule 4) | `06-INFRASTRUCTURE/02-ci-automation` | `10-LESSONS_LEARNED/03-process` |
| Dependency scanning | `01-FOUNDATION/03-universal-rules` (Rule 5) | `06-INFRASTRUCTURE/02-ci-automation` | `00-USE-WITH-ANY-LLM` |

## Architecture & Design

| Topic | Primary | Related | Also See |
|-------|---------|---------|----------|
| Module decomposition | `03-ARCHITECTURE/01-overview` | `05-DEVELOPMENT/01-coding-standards` | `10-LESSONS_LEARNED/01-architecture` |
| Provider abstraction | `03-ARCHITECTURE/05-provider-abstraction` | `06-INFRASTRUCTURE/01-deployment` | `12-APPENDIX/02-tech-comparison` |
| API design | `03-ARCHITECTURE/04-api-design` | `04-SECURITY/01-authentication` | `02-PROJECT_SETUP/03-repository-structure` |
| Processing pipeline | `03-ARCHITECTURE/06-processing-pipeline` | `06-INFRASTRUCTURE/03-rate-limiting` | `10-LESSONS_LEARNED/01-architecture` |
| Data flow | `03-ARCHITECTURE/01-overview` | `04-SECURITY/04-data-protection` | `11-CHECKLISTS/03-security-release` |

## Security & Compliance

| Topic | Primary | Related | Also See |
|-------|---------|---------|----------|
| Authentication | `04-SECURITY/01-authentication` | `03-ARCHITECTURE/04-api-design` | `04-SECURITY/06-pentest-checklist` |
| Cryptography | `04-SECURITY/03-cryptography` | `03-ARCHITECTURE/01-overview` | `10-LESSONS_LEARNED/02-security` |
| Data protection | `04-SECURITY/04-data-protection` | `04-SECURITY/05-compliance` | `02-PROJECT_SETUP/04-configuration` |
| Compliance (GDPR/PSD3) | `04-SECURITY/05-compliance` | `04-SECURITY/04-data-protection` | `11-CHECKLISTS/03-security-release` |
| Pentest checklist | `04-SECURITY/06-pentest-checklist` | `04-SECURITY/01-authentication` | `05-DEVELOPMENT/02-testing-strategy` |
| Pentesting agent (automated) | `04-SECURITY/09-pentesting-agent` | `05-DEVELOPMENT/02-testing-strategy` | `10-LESSONS_LEARNED/02-security` |
| Security by design | `00-USE-WITH-ANY-LLM` (Phase 5 approval gate) | `04-SECURITY/*` | `11-CHECKLISTS/06-governance-records` |
| Input validation (5 checks) | `04-SECURITY/07-input-validation` | `04-SECURITY/08-memory-wiping` | `10-LESSONS_LEARNED/02-security` |
| Memory wiping (secure) | `04-SECURITY/08-memory-wiping` | `04-SECURITY/03-cryptography` | `10-LESSONS_LEARNED/02-security` |
| Dependency scanning | `01-FOUNDATION/03-universal-rules` (Rule 5) | `06-INFRASTRUCTURE/02-ci-automation` | `04-SECURITY/09-pentesting-agent` |

## Development

| Topic | Primary | Related | Also See |
|-------|---------|---------|----------|
| Coding standards | `05-DEVELOPMENT/01-coding-standards` | `03-ARCHITECTURE/01-overview` | `10-LESSONS_LEARNED/03-process` |
| Testing strategy | `05-DEVELOPMENT/02-testing-strategy` | `10-LESSONS_LEARNED/02-security` | `06-INFRASTRUCTURE/02-ci-automation` |
| Local dev workflow | `05-DEVELOPMENT/03-local-dev-workflow` | `06-INFRASTRUCTURE/01-deployment` | `10-LESSONS_LEARNED/01-architecture` |
| Feature flags | `05-DEVELOPMENT/05-feature-flags` | `03-ARCHITECTURE/06-processing-pipeline` | `02-PROJECT_SETUP/04-configuration` |

## Infrastructure

| Topic | Primary | Related | Also See |
|-------|---------|---------|----------|
| Deployment | `06-INFRASTRUCTURE/01-deployment` | `05-DEVELOPMENT/03-local-dev-workflow` | `08-PROJECT_MANAGEMENT/01-planning-roadmap` |
| CI & Automation | `06-INFRASTRUCTURE/02-ci-automation` | `09-AUTOMATION_AGENTS/01-agent-orchestration` | `10-LESSONS_LEARNED/03-process` |
| Rate limiting | `06-INFRASTRUCTURE/03-rate-limiting` | `04-SECURITY/01-authentication` | `03-ARCHITECTURE/04-api-design` |
| Retry (backoff + circuit breaker) | `06-INFRASTRUCTURE/04-retry-pattern` | `04-SECURITY/07-input-validation` | `10-LESSONS_LEARNED/01-architecture` |
| CI/CD | `05-DEVELOPMENT/04-ci-cd` | `06-INFRASTRUCTURE/02-ci-automation` | `08-PROJECT_MANAGEMENT/01-planning-roadmap` |

## Automation & Agents

| Topic | Primary | Related | Also See |
|-------|---------|---------|----------|
| Agent orchestration | `09-AUTOMATION_AGENTS/01-agent-orchestration` | `06-INFRASTRUCTURE/02-ci-automation` | `10-LESSONS_LEARNED/03-process` |
| Watchdog & disposition | `09-AUTOMATION_AGENTS/02-watchdog-and-disposition` | `09-AUTOMATION_AGENTS/01-agent-orchestration` | `06-INFRASTRUCTURE/02-ci-automation` |

## Project Management

| Topic | Primary | Related | Also See |
|-------|---------|---------|----------|
| Planning & roadmap | `08-PROJECT_MANAGEMENT/01-planning-roadmap` | `01-FOUNDATION/01-problem-purpose` | `12-APPENDIX/01-notap-reference` |

## Lessons Learned

| Topic | Primary | Related | Also See |
|-------|---------|---------|----------|
| Architecture lessons | `10-LESSONS_LEARNED/01-architecture` | `03-ARCHITECTURE/*` | `05-DEVELOPMENT/*` |
| Security lessons | `10-LESSONS_LEARNED/02-security` | `04-SECURITY/*` | `11-CHECKLISTS/03-security-release` |
| Process lessons | `10-LESSONS_LEARNED/03-process` | `06-INFRASTRUCTURE/02-ci-automation` | `09-AUTOMATION_AGENTS/*` |

## Checklists

| Checklist | Use When | Related |
|-----------|----------|---------|
| New project | Starting from scratch | `02-PROJECT_SETUP/*` |
| New feature | Adding to existing project | `05-DEVELOPMENT/*`, `04-SECURITY/*` |
| Security release | Before any release | `04-SECURITY/*`, `10-LESSONS_LEARNED/02-security` |
| Policy creation | BEFORE any code (Phase 2 mandatory) | `11-CHECKLISTS/08-policy-creation` |
| Governance records | Every feature, decision, and incident | `11-CHECKLISTS/06-governance-records` |
| Documentation matrix | Every commit — which docs must update | `11-CHECKLISTS/07-documentation-matrix` |
| LLM responsibility | How the LLM should guide (never guess, web search) | `00-USE-WITH-ANY-LLM` (LLM Responsibility section) |
| LLM instruction crafting | How to write prompts that get consistent output | `02-PROJECT_SETUP/05-llm-instruction-crafting` |
| Input validation | 5-layer defense in depth | `04-SECURITY/07-input-validation` |
| Memory wiping | Secure buffer zeroing after use | `04-SECURITY/08-memory-wiping` |
| Testing strategy | Tests always, every change, risk assessment first | `05-DEVELOPMENT/02-testing-strategy` |
| Pentesting agent | Automated break-your-code + periodic runs | `04-SECURITY/09-pentesting-agent` |
| Human pentesters | When to hire + where to find + budget guide | `04-SECURITY/06-pentest-checklist` (top section) |
| Community tools | Open-source/free tools for every stage | `12-APPENDIX/05-community-tools` |
| Retry pattern | Exponential backoff + circuit breaker | `06-INFRASTRUCTURE/04-retry-pattern` |
| Feature flags | Toggling features per env/platform/test | `05-DEVELOPMENT/05-feature-flags` |
| Feature scope decisions | When to add/remove features | `09-AUTOMATION_AGENTS/02-watchdog-and-disposition` |
| Pivot | Changing direction | `12-APPENDIX/01-notap-reference` |
| Universal rules | Every single commit (non-negotiable) | `01-FOUNDATION/03-universal-rules` |
| Pattern gallery per language | Multi-lang reference for each rule | `12-APPENDIX/04-pattern-gallery-per-language` |
| Project-type preset | After discovery, before pattern matching | `02-PROJECT_SETUP/06-project-type-presets` |
| Deploy to Fly.io | Web API deployment | `scripts/deploy/fly.toml` |
| Deploy to Render | Web API deployment | `scripts/deploy/render.yaml` |
| Deploy to Railway | Web API deployment | `scripts/deploy/railway.json` |
| Dockerize | Multi-stage Dockerfile | `scripts/deploy/Dockerfile` |
| Daily dev | Every development day | `05-DEVELOPMENT/02-testing-strategy` |

## Appendix

| Topic | Content |
|-------|---------|
| NoTap reference | How the patterns map to a real production system |
| Tech comparison | Detailed pros/cons with web-researched data |
| Example Express API | Runnable demo of blueprint patterns (33 tests) |
| Pattern gallery by language | How each rule looks in Node/Python/Go/Rust/Java |
| Community tools catalog | Open-source/free tools for dev, security, design, ops |
| Deploy templates | Dockerfile, railway.json, fly.toml, render.yaml |

---

## Reading Order for LLM Agents

### Automated Flow (Recommended)

Give any LLM this instruction along with the blueprint:

```
Read MASTER_DEVELOPMENT_BLUEPRINT/00-USE-WITH-ANY-LLM.md first,
then start the discovery phase. Ask me questions about my project
before recommending anything.
```

The LLM will run the full interactive process: discovery → **policy creation (mandatory)** → pattern matching → decision trees → governance records → implementation → validation.

### Manual Reading Order

Read in this order if reading without the interactive flow:

1. `00-USE-WITH-ANY-LLM.md` — **START HERE** Instructions for any LLM
2. `02-PROJECT_SETUP/06-project-type-presets.md` — **FILTER BY PROJECT TYPE** Which sections apply to your project
3. `01-FOUNDATION/03-universal-rules.md` — **LANGUAGE-AGNOSTIC CORE** Non-negotiable rules: no console.log, no hardcoded secrets, everything in variables, automated scanning
3. `11-CHECKLISTS/08-policy-creation.md` — **MANDATORY before any code** — Create DATA, SECURITY, COMPLIANCE, PRIVACY policies
4. `README.md` — What this blueprint is
5. `01-FOUNDATION/01-problem-purpose.md` — The project's why
6. `10-LESSONS_LEARNED/*` — Start with mistakes to avoid (highest ROI)
7. `04-SECURITY/*` — Security is non-negotiable (includes input validation + memory wiping)
8. `06-INFRASTRUCTURE/04-retry-pattern.md` — Resilience patterns (backoff, circuit breaker)
9. `03-ARCHITECTURE/01-overview.md` — System understanding
10. `05-DEVELOPMENT/*` — Testing + local dev workflow + feature flags
11. `06-INFRASTRUCTURE/02-ci-automation.md` — Pre-push checks + CI (includes universal rule scanning)
12. `06-INFRASTRUCTURE/03-rate-limiting.md` — 3-tier escalation
13. `11-CHECKLISTS/02-new-feature.md` — Before writing code
14. `11-CHECKLISTS/06-governance-records.md` — Risk assessment, decision, and failure logs
15. `11-CHECKLISTS/07-documentation-matrix.md` — What docs to update per change type
16. `02-PROJECT_SETUP/05-llm-instruction-crafting.md` — How to write prompts for any LLM
17. `09-AUTOMATION_AGENTS/01-agent-orchestration.md` — Team integration
18. `09-AUTOMATION_AGENTS/02-watchdog-and-disposition.md` — Self-healing agents + veto rules
19. `05-DEVELOPMENT/05-feature-flags.md` — Toggle features per env/platform/test
20. `03-ARCHITECTURE/06-processing-pipeline.md` — Validate→Normalize→Hash→Store pattern
21. `12-APPENDIX/04-pattern-gallery-per-language.md` — How each rule looks in Node/Python/Go/Rust/Java
22. `12-APPENDIX/03-example-express-api/README.md` — Runnable example with 33 passing tests
