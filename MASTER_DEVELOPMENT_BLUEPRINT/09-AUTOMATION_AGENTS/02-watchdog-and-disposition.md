# Agent Watchdog & Disposition Patterns

Two patterns that make autonomous systems safe to operate: self-healing health monitoring (watchdog) and rule-based conflict resolution (disposition).

---

## Pattern 1: Watchdog (Self-Healing Health Monitor)

### Why

Autonomous agents/services crash, hang, or degrade silently. A watchdog periodically checks health and restarts failed components automatically. No human needs to wake up at 3 AM to restart a process.

### Architecture

```
Watchdog (runs every N seconds)
    │
    ├─ Check: Is process alive? (PID check)
    ├─ Check: Is process responsive? (HTTP health check)
    ├─ Check: Is recent output valid? (log tail)
    │
    ├─ Healthy? → Sleep, check again
    ├─ Unhealthy? → Kill process → Restart → Log incident
    └─ Repeated failures? → Escalate to on-call (PagerDuty/email)
```

### Implementation

```bash
#!/usr/bin/env bash
# scripts/watchdog.sh
# Self-healing monitor for background agents

HEALTH_URL="http://localhost:3100/health"
LOG_FILE="/var/log/agent.log"
RESTART_COUNT=0
MAX_RESTARTS=3
COOLDOWN=30  # seconds between checks

check_health() {
    # 1. HTTP health check
    local http_status
    http_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH_URL" 2>/dev/null)

    if [[ "$http_status" != "200" ]]; then
        echo "[WATCHDOG] Health check failed (HTTP $http_status)" | tee -a "$LOG_FILE"
        return 1
    fi

    # 2. Check process is alive
    if ! pgrep -f "agent" > /dev/null 2>&1; then
        echo "[WATCHDOG] Process not running" | tee -a "$LOG_FILE"
        return 1
    fi

    # 3. Check recent log output (last 60s)
    local last_output
    last_output=$(tail -1 "$LOG_FILE" 2>/dev/null)
    if [[ -z "$last_output" ]]; then
        echo "[WATCHDOG] No recent log output — possible hang" | tee -a "$LOG_FILE"
        return 1
    fi

    return 0
}

restart_agent() {
    echo "[WATCHDOG] Restarting agent (attempt $((RESTART_COUNT + 1)))" | tee -a "$LOG_FILE"

    # Kill existing process
    pkill -f "agent" 2>/dev/null || true
    sleep 2

    # Start new process
    nohup ./scripts/start-agent.sh > "$LOG_FILE" 2>&1 &
    local pid=$!

    # Wait for startup
    sleep 5
    if kill -0 $pid 2>/dev/null; then
        echo "[WATCHDOG] Agent restarted (PID: $pid)" | tee -a "$LOG_FILE"
        return 0
    else
        echo "[WATCHDOG] Agent failed to start" | tee -a "$LOG_FILE"
        return 1
    fi
}

# Main loop
while true; do
    if ! check_health; then
        if [[ $RESTART_COUNT -lt $MAX_RESTARTS ]]; then
            if restart_agent; then
                ((RESTART_COUNT++))
                sleep "$COOLDOWN"
                continue
            fi
        fi

        # Escalate
        echo "[WATCHDOG] CRITICAL: Max restarts ($MAX_RESTARTS) exceeded. Escalating." | tee -a "$LOG_FILE"
        curl -s -X POST "$ESCALATION_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d '{"message": "Agent watchdog: max restarts exceeded", "severity": "critical"}' &
        exit 1
    fi

    # Reset restart count after successful check (grace period)
    if [[ $RESTART_COUNT -gt 0 ]]; then
        ((RESTART_COUNT--))  # Gradual recovery
    fi

    sleep "$COOLDOWN"
done
```

### Usage

```bash
# Start with timeout (kill agent if it hangs for >10s)
bash scripts/watchdog.sh --timeout 10 --apply

# Dry run (log what would happen, don't restart)
bash scripts/watchdog.sh --timeout 10

# Custom interval
bash scripts/watchdog.sh --timeout 10 --interval 60
```

### Phases

```
Phase 1: Probe     → Check health (HTTP, PID, log age)
Phase 2: Restart   → Kill → Wait → Start → Wait → Verify
Phase 3: Escalate  → Notify on-call (PagerDuty, email, Slack) if Phase 2 fails
Phase 4: Recovery  → Gradual restart count decrement after sustained health
```

### Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Watchdog restarts in a tight loop (thrashing) | Cooldown + max restart limit + escalation |
| Watchdog only checks PID (process could be hung) | HTTP health endpoint + log freshness check |
| Restart count never resets | Gradual decrement on successful health checks |
| No escalation when restart fails | Webhook on max restart exceeded |
| Watchdog is a single point of failure | Run two watchdogs that watch each other |

---

## Pattern 2: Disposition (Conflict Resolution)

### Why

When multiple agents/services disagree, you need clear rules about who wins. Without these rules, you get:
- The Engineer ships insecure code because Security was "too slow"
- The DPO blocks a feature over a non-issue
- The CRO wants more restrictions than the product can bear

### The Matrix: Who Has Veto Power

```yaml
# disposition-rules.yaml

# Each decision type maps to a primary authority + override process

veto_powers:
  security_decision:
    primary: Security Agent
    override: CEO + Engineer joint sign-off (both required)
    override_justification: "Critical: verified reduced blast radius, documented risk acceptance"
  
  privacy_decision:
    primary: DPO Agent
    override: CEO + Compliance joint sign-off
    override_justification: "Legal review completed, user consent mechanism in place"
  
  architecture_decision:
    primary: Engineer Agent
    override: CEO + Security (if security implications)
    override_justification: "Performance requirement exceeds architecture constraint"
  
  compliance_decision:
    primary: Compliance Agent
    override: CEO + DPO (if privacy), CEO + Security (if security)
    override_justification: "Regulatory exception filed, audit trail documented"
```

### Resolution Protocol (Order of Operations)

```javascript
// When two agents disagree on a decision:
function resolveConflict(proposal, objections) {
    // Step 1: Identify the type of decision
    const decisionType = classifyDecision(proposal);

    // Step 2: Identify primary authority
    const primary = getPrimaryAuthority(decisionType);

    // Step 3: Check if primary has veto
    if (objections.includes(primary)) {
        // Primary says no → hard block
        return {
            result: 'BLOCKED',
            reason: `${primary} vetoed ${decisionType}`,
            overrideAvailable: true,
            overrideRequired: getOverrideRequired(decisionType)
        };
    }

    // Step 4: Non-primary objections → advisory
    return {
        result: 'ADVISORY_BLOCK',
        objections: objections.filter(o => o !== primary),
        primaryDecision: 'ALLOWED',
        overridableBy: 'primary_authority'
    };
}
```

### Veto Override Process (Rare, Documented)

When you must override a primary veto, every override is logged:

```yaml
# decision-log/VETO-OVERRIDE-001.yaml
id: VETO-OVERRIDE-001
date: 2026-05-27
decision_type: security_decision
primary_veto: Security Agent
overridden_by:
  - CEO
  - Engineer
justification: >
  One-time rate limit bypass for white-hat pentest.
  Blast radius limited to test UUIDs prefix-0000.
  Restored within 24h.
risk_acceptance:
  documented_by: CRO
  accepted_by: CEO
  expiry: 2026-05-28
```

### Startup Validation (Enforce at Boot)

```javascript
// startup-validator.js
// Called at application startup to ensure disposition rules are loaded

function validateDispositionRules() {
    const requiredRules = ['security_decision', 'privacy_decision', 'architecture_decision', 'compliance_decision'];
    const loaded = loadDispositionRules();

    for (const rule of requiredRules) {
        if (!loaded[rule]) {
            throw new Error(`Missing disposition rule: ${rule}`);
        }
        if (!loaded[rule].primary) {
            throw new Error(`Disposition rule ${rule} missing primary authority`);
        }
    }

    // Validate override paths exist
    for (const [type, config] of Object.entries(loaded)) {
        if (config.override) {
            const required = config.override.split(' + ');
            for (const role of required) {
                if (!getAvailableRoles().includes(role)) {
                    console.warn(`Override role ${role} for ${type} not available in current config`);
                }
            }
        }
    }

    console.log('[VALIDATOR] Disposition rules verified:', Object.keys(loaded).join(', '));
}
```

### Agent-Specific Veto Rules

```javascript
// What each agent can block

const AGENT_VETO_RULES = {
    Security: {
        canBlock: ['code_release', 'dependency_update', 'architecture_change', 'data_flow_change'],
        cannotBlock: ['pricing', 'marketing_copy', 'feature_priority'],
        mustJustify: true,     // "Blocked because: X vulnerability"
        autoLift: '24h',       // Veto auto-expires if no follow-up within 24h
    },
    DPO: {
        canBlock: ['data_collection', 'new_field_storage', 'third_party_sharing', 'retention_change'],
        cannotBlock: ['crypto_algorithm', 'deployment_target', 'code_style'],
        mustJustify: true,
        autoLift: '48h',
    },
    Engineer: {
        canBlock: ['architecture_decision', 'tech_stack_change', 'api_change'],
        cannotBlock: ['privacy_policy', 'compliance_filing', 'security_remediation'],
        mustJustify: true,
        autoLift: '72h',
    },
};
```

### Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Everyone has veto over everything | Clear scope per agent (canBlock/cannotBlock) |
| Veto has no expiration | autoLift — veto auto-expires without follow-up |
| Override process is ad-hoc | Standardized override form with required sign-offs |
| Disposition rules not enforced | Startup validator checks rules are loaded |
| Agent can block outside its domain | cannotBlock list enforced in middleware |

## Checklist

- [ ] Disposition matrix defined for all decision types
- [ ] Each agent has clear canBlock/cannotBlock scope
- [ ] Override process documented with required sign-offs
- [ ] Veto auto-expiration configured
- [ ] Startup validator enforces disposition rules
- [ ] All overrides logged to decision log
- [ ] Watchdog health check includes 3 dimensions (PID, HTTP, log freshness)
- [ ] Watchdog has max restart limit with escalation
- [ ] Watchdog restart count decrements on sustained health
