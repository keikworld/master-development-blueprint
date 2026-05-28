# NoTap Reference

## Overview

NoTap is a production authentication system that this blueprint's patterns were battle-tested against. The blueprint doesn't document a specific codebase — it documents the **universal patterns** that emerged from building and operating a real fintech product.

Use this appendix as a **conceptual map**: it shows how the abstract patterns in this blueprint connect together in practice.

---

## How the Patterns Map to a Real System

```
┌─────────────────────────────────────────────────────────────┐
│                      The Concept                            │
│                                                             │
│  Processing Pipeline + Provider Abstraction                 │
│  + Constant-Time Crypto + Rate Limiting                     │
│  + 3-Layer Validation + Pre-Push Agent                      │
│  + Lessons Learned + Compliance-First                       │
│                                                             │
│  All wired together into one production system              │
└─────────────────────────────────────────────────────────────┘
```

Every pattern in this blueprint serves a real purpose. Here's how they connect:

| Pattern | Why It Exists |
|---------|---------------|
| **Processing pipeline** | Every data path has validate → normalize → secure → store steps |
| **Provider abstraction** | Redis, DB, KMS — swap any without code changes |
| **Constant-time crypto** | All secret/digest comparisons — timing attacks are real |
| **3-tier rate limiting** | Escalating cooldowns stop brute-force without blocking legit users |
| **5-layer input validation** | Defense in depth: wire → route → service → domain → storage |
| **Pre-push agent** | 56 automated checks prevent bad code from leaving your machine |
| **Tests-first** | Every new feature starts with tests that define correct behavior |
| **Compliance-first** | Data matrix + legal basis + risk assessment before any code |
| **Lessons learned** | 100+ documented incidents prevent repeating expensive mistakes |
| **Memory wiping** | Secrets cleaned from RAM in `finally` blocks — no excuses |

---

## The Anti-Patterns We Discovered

These are **more valuable than the patterns** because they each cost real money to learn:

### "We'll add security later"
Added JWT middleware to routes one by one. Missed three routes in the PR. Lesson: wire auth/rate-limit/replay-protection at the **router level**, not per-route.

### "It's just one env var"
Production MySQL shut down for maintenance. The app crashed because there was no fallback. Lesson: every dependency needs a degraded path — graceful degradation, not crash.

### "This route doesn't need validation"
A POST route added later didn't inherit validation from GET routes. An attacker passed a URL that triggered an internal DNS lookup. Lesson: SSRF check must be symmetric across CRUD.

### "We'll remember to wipe the secret"
A session token was recoverable from a core dump six months later. Lesson: memory wiping is code, not intent. Always `fill(0)` in `finally`.

### "Constant time doesn't matter for this"
An admin API key was compared with `!==`. The timing leak let an attacker brute-force it character by character. Lesson: any comparison where one side is user-controlled must be constant-time.

### "The tests passed locally"
A developer's local DB had different indexes than production. A query that ran in 50ms locally took 12 seconds in prod. Lesson: test infrastructure must mirror production, or you're not testing.

---

## Safe Sharing Guide — What NOT to Expose in Open-Source

This blueprint is useful because it shares **patterns, not internals**. When extracting patterns from your own project, follow these rules:

### Never Share
| What | Why It's Dangerous |
|------|-------------------|
| **Full directory tree** | Maps your entire codebase for attackers |
| **Package paths** | `com/yourcompany.product.module` reveals internal structure |
| **File paths to specific implementations** | `src/commonMain/.../crypto/ConstantTime.kt` pinpoints attack surface |
| **Backend service/middleware counts** | "48 routers, 60 services" tells attackers the blast radius |
| **Internal configuration keys** | `yourproduct-v1-app-key` reveals derivation naming conventions |
| **Local machine paths** | `/home/user/project/` is an OSINT risk |
| **Infrastructure directory names** | `redis/tls/`, `pentest/` tell attackers where to look |
| **Exact version numbers** | `v3.35.0` lets attackers find specific vulnerabilities |
| **LOC counts** | Gives competitors a proxy for team size and complexity |
| **Internal tool/script names** | Paperclip, pre-push agent names tell attackers your tooling |

### Safe to Share
| What | Example |
|------|---------|
| **Conceptual architecture** | "SDK layer + Backend layer + Web layer" |
| **Pattern descriptions** | "Processing pipeline: validate → normalize → secure → store" |
| **Why a pattern exists** | "Timing attacks are real — always compare secrets in constant time" |
| **Anti-pattern examples** | What went wrong, but with **generic code** (no real file paths) |
| **Code templates** | Generic `const { constantTimeCompare } = require('./utils/constantTimeCompare')` |
| **Architecture decisions** | "We chose KMP for shared business logic because..." |
| **Testing strategies** | "Test each pipeline step in isolation, not the whole flow" |

### The Test: Would You Show This to a Competitor?

Before adding any specific file path, internal name, or count to a public template, ask:

> **"If a competitor read this, would they learn anything about our internal architecture they couldn't infer from our public API?"**

If the answer is yes, generalize it or leave it out.

---

## What This Blueprint Extracted

From the NoTap system, we extracted:
- The **engineering philosophy** — discipline over art, security as architecture
- The **process** — governance workflow, pre-push gates, lessons learned
- The **security patterns** — constant-time, memory wipe, CSPRNG, replay protection
- The **architecture patterns** — provider abstraction, processing pipeline, validation layers
- The **anti-patterns** — every mistake we made so you don't have to

What we **didn't** extract and why:
- **Specific business logic** — that's your domain, not a reusable pattern
- **Internal file structure** — you need your own, organized for your project
- **Vulnerability details** — disclosure would put production users at risk
- **Configuration secrets** — you'll generate your own env vars, salts, and keys

---

## Applying These Patterns

When building your project:

1. **Start with the universal rules** (`01-FOUNDATION/03-universal-rules.md`) — no console.log, no hardcoded secrets, no untrusted input
2. **Pick the patterns that match your scale** — a CRUD API doesn't need ZK proofs
3. **Let the LLM discriminate** — it reads your project, reads the blueprint, and picks what fits
4. **Learn from our anti-patterns** — they cost us real money, they're free for you

The goal isn't to build the next NoTap. The goal is to build **your project** with the same level of engineering discipline, in a fraction of the time, without repeating the same mistakes.
