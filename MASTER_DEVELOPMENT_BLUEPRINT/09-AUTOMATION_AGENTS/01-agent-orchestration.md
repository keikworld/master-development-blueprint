# LLM Agent Orchestration

## Multi-Agent Architecture

```
┌─────────────────────────────────────────────────┐
│             Orchestrator (Paperclip)             │
├────────┬────────┬────────┬────────┬─────────────┤
│  CEO   │Engineer│Security│  DPO   │  Compliance  │
│ Agent  │ Agent  │ Agent  │ Agent  │   Agent      │
├────────┴────────┴────────┴────────┴─────────────┤
│                  Gateway (your choice)           │
├─────────────────────────────────────────────────┤
│              Inference (your model)              │
└─────────────────────────────────────────────────┘
```

This blueprint uses [Paperclip](https://github.com/anomalyco/paperclip) for multi-agent orchestration — it's the tool that powers the NoTap development pipeline. Paperclip handles agent-to-agent routing, token auth, and audit logging.

**You can use Paperclip or any orchestrator.** Swap in your own gateway (OpenClaw, custom, etc.) and inference layer (Ollama, OpenAI, Anthropic, your own API). The architecture pattern stays the same regardless of tooling.

---

## Agent Roles

| Agent | Role | Domain |
|-------|------|--------|
| CEO | Strategic direction, prioritization | Business, product |
| Engineer | Implementation, architecture, code review | Code, structure |
| Security | Threat modeling, pentest, vulnerability | Security, cryptography |
| DPO | Data protection, privacy, GDPR | Privacy, user rights |
| Compliance | Regulatory, PSD3, BIPA, SOC 2 | Regulation, auditing |
| CRO | Risk assessment, fraud detection | Risk, abuse prevention |
| ISO/NIST Chief | Standards compliance (ISO 27001, NIST CSF) | Frameworks, certification |

**You define the roles that fit your organization.** A solo founder might only need Engineer + Security. A regulated fintech needs the full set. Start minimal, add roles as your team and compliance requirements grow.

---

## Agent-to-Agent Communication

### Protocol

```javascript
{
    "agent": "security_agent",
    "action": "request_review",
    "target": "engineer_agent",
    "payload": {
        "type": "code_review",
        "module": "payment_verification",
        "files": ["Verifier.js"],
        "concerns": ["constant_time", "timing_attack"]
    },
    "nonce": "uuid-v4",
    "timestamp": 1716800000000
}
```

### Communication Rules

1. **Token auth** — All agent-to-agent calls require shared token
2. **Loopback-only** — Agents bind to localhost only
3. **Audit trail** — Every interaction logged with SHA-256 hash chain
4. **No secrets in prompts** — Agent prompts never contain raw secrets
5. **Human override** — CEO can cancel any agent action

---

## Getting Started with Paperclip

Paperclip is the orchestration layer used in this blueprint. You can adopt it as-is or use it as a reference for your own setup.

```bash
# Clone and set up Paperclip
git clone https://github.com/anomalyco/paperclip
cd paperclip
# Follow the setup guide in the Paperclip README
```

**What Paperclip gives you:**
- Role-based agent routing (CEO → Engineer → Security, etc.)
- Ed25519 key-pair authentication between agents
- Append-only audit log with SHA-256 hash chain
- Watchdog-compatible health endpoints

**What you provide:**
- Inference backend (local: Ollama, cloud: OpenAI/Anthropic, or hybrid)
- Agent prompts and domain knowledge
- Disposition rules (who has veto over what)

See the Paperclip repo for full setup instructions, configuration files, and examples.

---

## Pre-Push Agent System

This is a **generic pattern** — implement it with whatever tooling fits your stack.

### Installation (Run Once Per Clone)

```bash
chmod +x scripts/agent
chmod +x scripts/verify-tests.sh
ln -sf ../../scripts/pre-push-agent.sh   .git/hooks/pre-push
ln -sf ../../scripts/pre-commit-agent.sh .git/hooks/pre-commit
```

### Running Agents On-Demand

```bash
./scripts/agent @all          # Full pre-push check
./scripts/agent @sentry      # Gatekeeper
./scripts/agent @architect   # Patterns
./scripts/agent @compliance  # Regulatory
```

You define the check groups and what each validates. Start with 3-5 checks and expand as your project matures.

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All checks passed |
| 1 | Blocking violation (push blocked) |
| 2 | Warnings only (push allowed, inspect) |

### Troubleshooting

- If `git push` completes in <1s without agent banner, hooks are not installed — re-run install commands
- Exit code 126 from a hook = script not executable — `chmod +x` the script
- Bypass: `git push --no-verify` (emergencies only)

---

## Research Agents (Isolated Scouts)

Two standalone agents for external research, **fully isolated** from the core team:

| Agent | Role | Tools |
|-------|------|-------|
| **MRO** (Market Research Officer) | Competitive landscape, pricing, trends | LLM + web search |
| **TRO** (Technology Research Officer) | ZK proofs, crypto protocols, auth tech | LLM + web search |

### Containment Architecture

```
Research Agent (LLM)
    │
    ▼
JSON Schema Validation
    │
    ▼
Content Sanitization (no secrets)
    │
    ▼
SHA-256 Hash Chain (append-only)
    │
    ▼
Audit Log (CEO reads manually)
```

**Critical rules:**
- No access to internal orchestration API (read-only to outside world)
- No secrets in prompts
- All output validated through JSON Schema before acceptance
- CEO review required before any action based on research

### Usage

```bash
# Market research
bash scripts/research-agents/mro.sh "topic"

# Technology scouting
bash scripts/research-agents/tro.sh "topic"

# Audit
node scripts/research-agents/bridge.js --verify report.json
```

---

## Tailoring to Your Organization

These patterns are templates, not prescriptions. Here's how to adapt them:

### Start Small
- **Solo developer?** Just the pre-push agent + one CLAUDE.md file. No multi-agent orchestration needed.
- **Small team?** Engineer + Security agents. Add DPO when you handle user data.
- **Growing startup?** Add Compliance before your first regulatory audit (not after).
- **Enterprise?** Full 7-agent setup with disposition rules, watchdog, and escalation.

### Pick Your Models
- **Local only** (privacy-critical): Ollama with any open model
- **Cloud only** (simplicity): OpenAI, Anthropic, or any API
- **Hybrid**: Local for fintech/PII work, cloud for research agents

You don't need Paperclip either — the agent protocol and roles work with any orchestrator. The pattern is what matters.

---

## Project Intelligence Files

### CLAUDE.md (Mirrored to GEMINI.md + .antigravity.md)

Single source of truth for LLM agents. Updated when >500 LOC added or new patterns introduced.

**Required sections:**
1. Build & test commands (exact, verified)
2. Security patterns (constant-time, memory wipe, CSPRNG)
3. Coding conventions (naming, imports, module rules)
4. Project overview (architecture, directory structure)
5. Lessons learned (link to full file)
6. Key files (paths and purposes)

### AGENTS.md

Tool-agnostic companion to CLAUDE.md — same facts, different format. Updated whenever check counts, commands, file paths, or governance rules change.

---

## Inference & Warm-Up (Your Model, Your Choice)

If running locally (e.g., Ollama, LocalAI, llama.cpp):

```bash
# Warm-up: send a dummy inference to pre-load the model
# Prevents cold-start delays when an agent session begins
./scripts/warmup.sh
```

If using a cloud API (OpenAI, Anthropic, etc.), no warm-up needed — just set your API key and endpoint.

**Key principle:** All fintech/PII processing should use local inference if your compliance requirements demand it. Research and non-sensitive work can use cloud APIs. Design your agent prompts accordingly.
