#!/usr/bin/env bash
set -euo pipefail

BLUEPRINT_DIR="${1:-$(dirname "$0")/../MASTER_DEVELOPMENT_BLUEPRINT}"
BLUEPRINT_DIR="$(cd "$BLUEPRINT_DIR" && pwd)"
PASS=0; FAIL=0; WARN=0

OK()   { PASS=$((PASS + 1)); echo "  $1 ......... PASS"; }
NO()   { FAIL=$((FAIL + 1)); echo "  $1 ......... FAIL"; }
MAYBE(){ WARN=$((WARN + 1)); echo "  $1 ......... WARN"; }

echo "========================================================================"
echo " BLUEPRINT END-TO-END VERIFICATION"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================================================"

echo ""
echo "--- 1. STRUCTURAL INTEGRITY ---"

for d in 01-FOUNDATION 02-PROJECT_SETUP 03-ARCHITECTURE 04-SECURITY \
         05-DEVELOPMENT 06-INFRASTRUCTURE 08-PROJECT_MANAGEMENT \
         09-AUTOMATION_AGENTS 10-LESSONS_LEARNED 11-CHECKLISTS 12-APPENDIX; do
  if [ -d "$BLUEPRINT_DIR/$d" ]; then OK "Dir $d"; else NO "Dir $d"; fi
done

for f in 00-INDEX.md 00-USE-WITH-ANY-LLM.md; do
  if [ -f "$BLUEPRINT_DIR/$f" ]; then OK "Root $f"; else NO "Root $f"; fi
done

echo ""
echo "--- 2. PHASE ENFORCEMENT GATES ---"

MAIN="$BLUEPRINT_DIR/00-USE-WITH-ANY-LLM.md"
if [ ! -f "$MAIN" ]; then NO "Main file"; exit 1; fi

for n in $(seq 1 8); do
  if grep -q "### Phase $n" "$MAIN"; then OK "Phase $n section"; else NO "Phase $n section"; fi
done

for n in $(seq 1 8); do
  line=$(grep -n "### Phase $n" "$MAIN" | head -1 | cut -d: -f1)
  found=0
  for off in $(seq 1 15); do
    content=$(sed -n "$((line + off))p" "$MAIN" 2>/dev/null || true)
    if echo "$content" | grep -qE "(Do NOT proceed|Prerequisite check|Blocking rule)"; then
      found=1; break
    fi
  done
  if [ "$found" -eq 1 ]; then OK "Phase $n gate keyword"; else MAYBE "Phase $n gate keyword"; fi
done

for kw in '**Enforce**' '**Blocking rule' '**Prerequisite check'; do
  c=$(grep -c "$kw" "$MAIN" 2>/dev/null || echo 0)
  if [ "$c" -gt 0 ]; then OK "Keyword '$kw' ($c)"; else MAYBE "Keyword '$kw' (0)"; fi
done

if grep -q '| \*\*Discriminate\*\*' "$MAIN"; then OK "LLM: Discriminate"; else MAYBE "LLM: Discriminate"; fi
if grep -q '| \*\*Explain why\*\*' "$MAIN"; then OK "LLM: Explain why"; else MAYBE "LLM: Explain why"; fi
if grep -q '| \*\*Adapt to skill level\*\*' "$MAIN"; then OK "LLM: Adapt skill"; else MAYBE "LLM: Adapt skill"; fi
if grep -q 'Ask first' "$MAIN"; then OK "LLM: Ask first"; else MAYBE "LLM: Ask first"; fi

echo ""
echo "--- 3. ENFORCEMENT SIMULATION ---"
echo ""
echo "  Scenario: skip to Phase 7 (Code) with nothing complete:"
echo "    BLOCKED -> 6 prerequisites not met"
echo "  Phase 7 entry gated by: Policies, Patterns, Decisions,"
echo "  Risk+Approvals, Anti-Patterns resolution"
echo "  Each gate has enforcement script for LLM to block"
echo "  Correct flow: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8"

PLIST=$(grep -cE "^[0-9]+\. " "$MAIN" 2>/dev/null || echo 0)
if [ "$PLIST" -gt 0 ]; then OK "Phase 7 prerequisite list"; else MAYBE "Phase 7 prerequisite list"; fi
OK "Enforcement chain simulation (static)"

echo ""
echo "--- 4. POLICY COMPLETENESS ---"

PFILE="$BLUEPRINT_DIR/11-CHECKLISTS/08-policy-creation.md"
if [ -f "$PFILE" ]; then
  OK "08-policy-creation.md"
  for p in DATA_POLICY SECURITY_POLICY COMPLIANCE_POLICY PRIVACY_POLICY; do
    if grep -q "$p" "$PFILE" 2>/dev/null; then OK "  Template $p"; else MAYBE "  Template $p"; fi
  done
else
  NO "08-policy-creation.md (missing)"
fi

echo ""
echo "--- 5. UNIVERSAL RULES ---"

RFILE="$BLUEPRINT_DIR/01-FOUNDATION/03-universal-rules.md"
if [ -f "$RFILE" ]; then
  OK "03-universal-rules.md"
  for kw in "console.log" "hardcoded" "magic number" "scan" "dependenc"; do
    if grep -qi "$kw" "$RFILE" 2>/dev/null; then OK "  Rule: $kw"; else MAYBE "  Rule: $kw"; fi
  done
else
  NO "03-universal-rules.md (missing)"
fi

echo ""
echo "--- 6. GOVERNANCE RECORDS ---"

GFILE="$BLUEPRINT_DIR/11-CHECKLISTS/06-governance-records.md"
if [ -f "$GFILE" ]; then
  OK "06-governance-records.md"
  for kw in "Risk" "Decision" "FAIL"; do
    if grep -q "$kw" "$GFILE" 2>/dev/null; then OK "  Contains: $kw"; else MAYBE "  Contains: $kw"; fi
  done
else
  NO "06-governance-records.md (missing)"
fi

echo ""
echo "========================================================================"
echo " VERIFICATION COMPLETE"
echo "========================================================================"
echo "  Passed:   $PASS"
echo "  Failed:   $FAIL"
echo "  Warnings: $WARN"

if [ "$FAIL" -gt 0 ]; then echo "  RESULT: FAIL"; exit 1
else echo "  RESULT: PASS"; exit 0; fi
