# Weekend Project: From Zero to Deployed in 2 Days

## The Idea

You have an idea Friday night. By Sunday night it's deployed, tested, and real. No analysis paralysis. No "I'll start next weekend." No half-finished repo that collects dust.

This is the fast-track through the Master Development Blueprint. It skips optional depth but enforces what matters. You trade completeness for speed — and that's fine. You can add depth later.

## When to Use This

- You have a clear, simple project idea (CRUD API, CLI tool, landing page + backend)
- You want to validate it quickly
- You're okay refactoring later as it grows

**Do NOT use this for:** Fintech, healthcare, anything handling PII, production infrastructure, or projects with compliance requirements. For those, go through the full 8-phase process.

## The Schedule

### Friday Night (1 hour): Idea + Setup

| Time | What | Done When |
|------|------|-----------|
| 8:00 PM | Write down your idea in 3 sentences | 8:10 PM |
| 8:10 PM | Run `bash init.sh` — name, type, language, go | 8:15 PM |
| 8:15 PM | Push to GitHub: `git remote add origin ... && git push` | 8:20 PM |
| 8:20 PM | Give your repo + the blueprint to an LLM | 8:30 PM |
| 8:30 PM | LLM Discovery phase — answer 10-15 questions | 8:50 PM |
| 8:50 PM | You have a clear spec. Done for the night. | 9:00 PM |

**Night-before prep:** While you sleep, the LLM has a full spec to work with in the morning.

### Saturday AM (4 hours): Foundation + First Feature

| Time | What |
|------|------|
| 9:00 AM | LLM creates policies (15 min) |
| 9:15 AM | LLM matches patterns from project-type presets (15 min) |
| 9:30 AM | 3 key decisions (DB, auth, deploy target) (15 min) |
| 9:45 AM | LLM writes tests for first feature — watch the tests fail first |
| 10:30 AM | LLM implements first feature — tests pass |
| 11:30 AM | BREAK |
| 11:45 AM | Second feature: tests-first, implement, pass |
| 1:00 PM | Lunch — core features done |

### Saturday PM (3 hours): Third Feature + Polish

| Time | What |
|------|------|
| 2:00 PM | Third feature: tests-first, implement, pass |
| 3:30 PM | Quick security scan (grep for console.log, hardcoded secrets) |
| 4:00 PM | Input validation on all endpoints |
| 5:00 PM | Done for the day. You have a working app. |

### Sunday AM (3 hours): Deploy

| Time | What |
|------|------|
| 10:00 AM | Choose deploy target (Railway / Fly.io / Vercel / Render) |
| 10:15 AM | Set up: copy deploy templates from the blueprint's `scripts/deploy/` or let the LLM generate them |
| 10:30 AM | Set env vars + secrets on the deploy platform |
| 11:00 AM | Deploy |
| 11:30 AM | Smoke test the live URL |
| 12:00 PM | Buy your domain, point DNS |
| 1:00 PM | Deployed and live. |

### Sunday PM (2 hours): Share + Next Steps

| Time | What |
|------|------|
| 2:00 PM | Write a README for your project |
| 2:30 PM | Share it (HN, Twitter, Reddit, friends) |
| 3:00 PM | Decide: iterate? launch? next project? |

## What Gets Skipped vs What's Mandatory

| Blueprint Element | Weekend? | Why |
|---|---|---|
| Universal Rules (5) | **MANDATORY** | No console.log, no hardcoded secrets, no magic numbers. These cause bugs immediately. |
| Input validation | **MANDATORY** | Without it, your API breaks on first real user. |
| Testing (tests-first) | **MANDATORY** | Weekend projects skip testing and never get finished. 10 tests per feature. |
| Rate limiting | Skip | Add after launch if you get traffic. |
| Retry patterns | Skip | Add when you add external API calls. |
| Circuit breaker | Skip | Add when you have service dependencies. |
| Provider abstraction | Skip | Single-server prototype doesn't need it. |
| Memory wiping | Skip | Unless you handle tokens/passwords. |
| Cryptography | Skip | Unless you do custom auth. |
| Policy creation | **MANDATORY** (fast) | 10 minutes, 4 templates, fill the blanks. |
| Risk assessment | **MANDATORY** (minimal) | 5-minute check: "what's the worst that could happen?" |
| Governance records | Skip | Come back when you have users. |
| Feature flags | Skip | Add when you have multiple environments. |
| Pre-push agent system | Skip | Add when you have a team. |

## The Tuesday Morning Rule

After your weekend launch, do these 3 things on Tuesday:

1. **Run the blueprints verify-blueprint.sh** on your project — check for structural issues
2. **Add rate limiting** if you saw any traffic
3. **Write down 3 things** you'd do differently — add them to your CLAUDE.md for next time

Then decide: is this a side project or a business? Either answer is fine.

## What This Is Not

- Not "skip everything and write spaghetti code." The mandatory items are mandatory for a reason.
- Not a license to ignore security. If your project handles money, health data, or personal info, go through the full 8-phase process.
- Not a replacement for thinking. The LLM guides you, but you make the decisions.
