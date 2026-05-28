# Crafting Instructions For Any LLM

## Why This Matters

Different LLMs interpret the same instruction differently. "Write secure code" means nothing to an LLM. "Use constant-time comparison for secrets, never use Math.random, set TTL on every Redis key, and use structured logger instead of console.log" — that produces consistent, correct output.

This guide teaches you how to write instructions that produce **consistent results** across any model (Claude, GPT, Gemini, DeepSeek, etc.).

---

## The 5 Rules of LLM Instructions

### Rule 1: Be Specific, Not Generic

```
❌ Weak: "Write good authentication code"
✅ Strong: "Implement JWT auth middleware with 15min access tokens, 7d refresh tokens, 
            constant-time comparison for secrets, rate limiting at 5 attempts/15min 
            before 15min cooldown, and structured audit logging with no PII"
```

Generic instructions produce generic output. Specific instructions produce production-ready output.

### Rule 2: Show, Don't Just Tell

```
❌ Weak: "Follow our security patterns"
✅ Strong: "Read 04-SECURITY/01-authentication.md line 45-89 for the requireAuth middleware 
            pattern. Read 04-SECURITY/03-cryptography.md line 20-35 for constant-time comparison. 
            Your code must match these patterns exactly."
```

LLMs pattern-match best when you point them to examples. Give file paths + line numbers.

### Rule 3: Define The Format

```
❌ Weak: "Document your decisions"
✅ Strong: "Log every architecture decision in this exact format:
            DECISION-003: [Title]
            Date: [ISO 8601]
            Options considered: [2-3 bullet points with pros]
            Chosen: [which]
            Rationale: [why this over alternatives]
            Rejected: [what and why not]"
```

LLMs follow format specifications precisely. If you want a table, say "create a table with columns X, Y, Z."

### Rule 4: Give The Validation Criteria

```
❌ Weak: "Check your work"
✅ Strong: "Before showing me the code, verify:
            1. Every comparison uses constantTimeCompare() for secrets
            2. Every Redis set() includes TTL in seconds
            3. No console.log — use structured logger
            4. No error.message exposed to client
            5. Co-authored-by: rastafalso <keikworldproject@gmail.com> in commit"
```

LLMs can self-validate if you give them explicit criteria. They don't need to run the code — they can check against rules.

### Rule 5: Chain Instructions With Sequence

```
❌ Weak: "Build the auth system"
✅ Strong: "Follow this sequence:
            1. FIRST: Read 04-SECURITY/01-authentication.md (the full file)
            2. THEN: Read backend/templates/middleware.js (the auth middleware template)
            3. THEN: Ask me about my auth requirements (token type, expiry, factors)
            4. THEN: Create a risk assessment for the auth endpoint
            5. ONLY THEN: Generate the code
            6. FINALLY: Self-validate against the checklist in 00-USE-WITH-ANY-LLM.md"
```

LLMs execute steps sequentially. Numbered steps prevent skipping.

---

## Instruction Templates

### Template 1: Quick Project Kickoff

Use this when starting a new project with an LLM:

```
You are an AI architect using the Master Development Blueprint at [PATH].

SEQUENCE:
1. Read MASTER_DEVELOPMENT_BLUEPRINT/00-USE-WITH-ANY-LLM.md completely
2. Start the Discovery phase — ask me all questions about my project
3. Once you understand my project, recommend the relevant blueprint sections
4. Show me decision trees for each architecture choice
5. Flag any anti-patterns in my approach
6. Create a risk assessment matrix for the first feature
7. Log every decision as DECISION-001, DECISION-002, etc.
8. After I approve, generate code following blueprint patterns
9. Add Co-authored-by: [USER NAME] <[USER EMAIL]> to every commit
10. Validate output against blueprint rules before showing me

CONSTRAINTS:
- NEVER skip steps 1-7
- If I say "just do it," explain why I need to answer questions first
- Always explain tradeoffs before choosing
- If a decision affects security or privacy, flag it
```

### Template 2: Add a Feature

```
You are an AI architect. I need to add [FEATURE DESCRIPTION].

BEFORE YOU CODE:
1. Read 11-CHECKLISTS/07-documentation-matrix.md — identify which docs must update
2. Read the relevant sections in MASTER_DEVELOPMENT_BLUEPRINT/ for this feature type
   - If API endpoint: read 04-SECURITY/01-authentication.md
   - If new test: read 05-DEVELOPMENT/02-testing-strategy.md
   - etc.
3. Ask me what I've already built related to this feature
4. Create a risk assessment for this feature (use 11-CHECKLISTS/06-governance-records.md)
5. Show me 2-3 implementation options with tradeoffs
6. Log the decision as DECISION-XXX

WHEN CODING:
7. Find and read 2-3 existing files in the same directory
8. Match their patterns exactly (import style, error handling, response format)
9. Read 10-LESSONS_LEARNED/02-security.md before implementing anything security-related
10. Every Redis set() gets a TTL
11. Every secret comparison uses constantTimeCompare()
12. Every commit includes Co-authored-by: [USER]

AFTER CODING:
13. Update task.md with what was built
14. Update planning.md if phase changed
15. If new lesson learned, update 10-LESSONS_LEARNED/
16. Self-validate against blueprint checklist
```

### Template 3: Fix a Bug

```
You are an AI architect. I found a bug: [DESCRIPTION].

SEQUENCE:
1. Read the failure/incident log template in 11-CHECKLISTS/06-governance-records.md
2. Ask me: what's the symptom, where to look, how to reproduce
3. Investigate the codebase for root cause
4. Create FAIL-XXX entry with: what happened, root cause, impact, fix, prevention
5. Implement the fix
6. Log any architectural decisions as DECISION-XXX
7. Update LESSONS_LEARNED.md if this is a novel mistake
8. Commit with Co-authored-by: [USER]
```

### Template 4: Review Existing Code

```
You are an AI architect. Review my code at [PATH/TO/FILE].

REVIEW CRITERIA (from blueprint rules):
1. Are Redis/DB calls going through provider abstraction or direct?
2. Is there TTL on every set()?
3. Are secret comparisons constant-time?
4. Is console.log used (should be structured logger)?
5. Are error messages safe (no error.message leaked)?
6. Is input validated (type, bounds, format)?
7. Are env vars accessed via config/secrets.js not process.env directly?
8. Is co-author attribution in the commit?
9. Does the corresponding documentation exist?

For each violation, explain:
- What's wrong
- Why it matters (what incident taught us this)
- How to fix it (with blueprint section reference)
```

---

## Anti-Patterns in LLM Instructions

| Bad Instruction | Why It Fails | Good Alternative |
|----------------|--------------|------------------|
| "Build a secure API" | "Secure" is undefined. Every LLM defines it differently. | "Build an API with JWT auth, rate limiting, input validation, structured logging, and constant-time comparisons" |
| "Follow best practices" | No shared definition of "best." | "Follow the patterns in 04-SECURITY/01-authentication.md" |
| "Make it scalable" | What scale? What bottleneck? | "Handle 10K concurrent users with Redis caching and PostgreSQL connection pooling" |
| "Document everything" | Too vague — LLM will write a novel. | "Update task.md, planning.md, and create a decision log entry (DECISION-XXX format)" |
| "Just do it" | Skips discovery phase, produces wrong output. | Refuse: "What type of project? What stack? What scale?" |
| "Use an interface for cache" | Correct but incomplete. | "Create ICacheService with connect/set/get/del/hSet/hGet/scan. Implement MemoryCacheService and RedisCacheService. Wire through ServiceFactory with CACHE_PROVIDER env var" |

---

## How The Blueprint Handles This

The blueprint already does Rule 2 (Show, don't tell) and Rule 3 (Define the format) for you. Every section includes:
- Concrete code examples (not abstract descriptions)
- Specific file paths with line references
- Anti-pattern tables (what NOT to do)
- Validation checklists

To use: point the LLM to specific sections with line numbers:

```
"Read 05-DEVELOPMENT/02-testing-strategy.md — implement the ICacheService pattern with 
MemoryCacheService and ServiceFactory exactly as shown at lines 25-90."
```

This produces consistent output across ANY LLM because you're giving it a template to copy, not a concept to interpret.
