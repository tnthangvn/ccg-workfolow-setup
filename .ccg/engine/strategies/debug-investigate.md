# Strategy: Debug Investigate

> Suitable for complex bugs with unknown causes. Requires parallel diagnostics and cross-validation with multiple models.

## Applicable Conditions
- Complexity M or above.
- Cause of error is unclear.
- Requires diagnostic analysis from multiple angles.

## Pre-loading

```
Read("/home/pc/.claude/.ccg/engine/model-router.md")
```

---

## Workflow State Machine

[phase-state:1-collect]
Current Phase: Information collection
📍 Next: Start dual-model diagnostics after error information is collected
[/phase-state:1-collect]

[phase-state:2-diagnose]
Current Phase: Parallel dual-model diagnostics
Gate: Error information collected ✓
📍 Next: Proceed to cross-validation after dual-model diagnostics return
[/phase-state:2-diagnose]

[phase-state:3-validate]
Current Phase: Cross-validation
Gate: Dual-model diagnostics have returned ✓
📍 Next: Ask the user to confirm fix direction after sorting hypotheses
[/phase-state:3-validate]

[phase-state:4-confirm]
Current Phase: User confirmation (HARD STOP)
Gate: Hypotheses sorted ✓
📍 Next: Enter fix phase after user confirmation
[/phase-state:4-confirm]

[phase-state:5-fix]
Current Phase: Fix and verify
Gate: User confirmed fix direction ✓
📍 Next: Report results after fix is complete
[/phase-state:5-fix]

---

## Phase Details

### Phase 1: Information Collection [required]

**Task Update**: `currentPhase → "1-collect"`, `nextAction → "Collect error information"`

1. Collect error context:
   - Error messages / Stack traces.
   - Reproduction steps (if any).
   - Recent relevant changes (`git log --oneline -10`).
   - Environment information (if relevant).

2. Search for relevant code (Grep/MCP).
3. Read potentially relevant files.

### Phase 2: Parallel Dual-Model Diagnostics [required]

**Gate check**: Error information collected

**Parallel Invocation** (`run_in_background: true`):
- **backend model**: debugger role
  ```
  <TASK>
  Requirement: Diagnose the following issue
  Context: [Error messages, stack traces, relevant code]
  </TASK>
  OUTPUT: Diagnostic hypotheses (sorted by probability, each containing: root cause analysis, evidence, fix recommendations)
  ```
- **frontend model**: debugger role (same format)

Wait for both models to return.

**Task Update**: `currentPhase → "2-diagnose"`, `nextAction → "Waiting for dual-model diagnostics to return"`

### Phase 3: Cross-Validation

**Gate check**: Dual-model diagnostics have returned

1. Compare diagnostic results from the two models.
2. Find points of consensus (issues pointed out by both models → High confidence).
3. Find points of divergence (issues pointed out by only one model → Needs validation).
4. Synthesize and sort all hypotheses:

```
🔍 Diagnostic Results

### High-Confidence Hypotheses (Dual-model consensus)
1. [Hypothesis] — [Evidence]
   Fix Scheme: [Specific scheme]

### Hypotheses to Validate (Single-model proposal)
2. [Hypothesis] — [Source model] — [Evidence]
   Fix Scheme: [Specific scheme]

### Excluded
- [Hypothesis] — [Exclusion reason]
```

### Phase 4: User Confirmation [required · HARD STOP]

**Gate check**: Hypotheses sorted

Present diagnostic results and ask the user to select a fix direction:
- Fix according to Hypothesis 1.
- Fix according to Hypothesis 2.
- Needs more investigation.
- Other direction.

**Task Update**:
```
Update task.json:
  currentPhase → "4-confirm"
  gate → "user_approval_required"
  nextAction → "Waiting for user confirmation of fix direction"
```

**Must wait for explicit user confirmation**; do not select automatically.

After user confirmation: `task.json: gate → null, currentPhase → "5-fix"`

### Phase 5: Fix and Verify

**Gate check**: User confirmed

1. Apply fix in the confirmed direction.
2. Run tests to verify.
3. If the fix is ineffective → Roll back, try the next hypothesis, or return to Phase 4 for re-confirmation.
4. Output results:
   ```
   ✅ Debugging Complete
     Root Cause: [Confirmed root cause]
     Fix: [Applied fix]
     Verification: [Test results]
     📍 Next: /ccg:commit to submit the fix
   ```

#### Spec Evolution (Must execute before archiving)

Refer to `phase-guide.md § 8 Spec Evolution Protocol` to execute:
1. Analyze this debugging session's root cause and fix scheme to distill reusable debugging experiences and defensive coding conventions.
2. If there are experiences worth recording (especially non-obvious pitfalls) → Draft Spec entries, present them to the user for confirmation, and append them to `.ccg/spec/{domain}/index.md`.
3. If there are no experiences worth distilling → Skip.

**Task Update**: `status → "archived"`

**Archive Task**:
```bash
mkdir -p .ccg/tasks/archive/$(date +%Y-%m) && mv .ccg/tasks/{task-name} .ccg/tasks/archive/$(date +%Y-%m)/
git add .ccg/tasks/ && git commit -m "chore: archive ccg task"
```

---

## Hard Rules

- **Phase 4 is a HARD STOP** — Do not determine the fix direction automatically.
- **Dual-model diagnostics must be parallel** — Independent diagnostics are necessary for cross-validation value.
- **Must diagnose before fixing** — Do not skip Phase 2-3 to modify code directly.
- **Must roll back if fix is ineffective** — Do not continue in the wrong direction.
