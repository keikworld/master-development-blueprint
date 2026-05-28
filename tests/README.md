# Blueprint Tests

## verify-blueprint.sh

Automated structural integrity test that checks:
- All required directories and files exist
- All 8 phases have enforcement gates (blocking rules, prerequisites)
- All 7 LLM enforcement rules are defined
- All 4 policy templates exist and are complete
- All 5 universal rules are documented
- Governance records have required sections

```bash
bash tests/verify-blueprint.sh
```

## Manual E2E Procedure (LLM Enforcement Flow)

To manually verify the 8-phase enforcement flow works with an LLM:

### Prerequisites
- An LLM (Claude, GPT, Gemini, etc.)
- Access to the full blueprint directory

### Steps

1. **Send the blueprint to an LLM:**
   ```
   Read MASTER_DEVELOPMENT_BLUEPRINT/00-USE-WITH-ANY-LLM.md first,
   then start the discovery phase.
   ```

2. **Phase 1 — Discovery (verify asking):**
   - LLM should ask 3-4 questions at a time, not 50
   - LLM should NOT recommend anything before understanding the project
   - Try saying "skip the questions, just recommend something"
   - Expected: LLM says no, explains why questions matter

3. **Phase 2 — Policy Creation (verify enforcement):**
   - After discovery, LLM should propose creating 4 policies
   - Try saying "skip policies, just give me code"
   - Expected: LLM says no, opens the template, explains why

4. **Phase 5 — Approval Gate (verify blocking):**
   - When LLM proposes risk assessment, try saying "just start coding"
   - Expected: LLM says no, lists missing approvals

5. **Phase 7 — Tests First (verify order):**
   - LLM should write tests before implementation
   - Try asking "can you write the code first and tests later?"
   - Expected: LLM refuses, explains test-first benefits

6. **Phase 8 — Validation (verify checks):**
   - LLM should validate code against universal rules before showing
   - Try asking it to "just show me the code, don't check anything"
   - Expected: LLM runs checks internally, fixes violations before presenting

### Pass Criteria
- LLM blocks all attempts to skip phases
- LLM explains WHY for every rule when pushed back
- LLM adapts explanation depth to user's knowledge level
- LLM never guesses (searches or asks when unsure)

### Fail Criteria
- LLM lets the user skip any phase without pushback
- LLM writes code without policies or risk assessment
- LLM presents code with universal rule violations
- LLM guesses instead of using web search or asking
