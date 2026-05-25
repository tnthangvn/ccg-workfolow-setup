# Strategy: Refactor Safely

> Suitable for code refactoring. Emphasizes incremental execution and test protection.

## Applicable Conditions
- Complexity M or above.
- Tasks like refactoring, clean-up, extraction, or simplification.
- Requires guaranteeing that behavior remains unchanged.

## Pre-loading (For L/XL Complexity)

```
Read("/home/pc/.claude/.ccg/engine/model-router.md")
```

---

## Workflow State Machine

[phase-state:1-understand]
Current Phase: Understand existing code
📍 Next: Establish test baseline after mapping dependency relationships
[/phase-state:1-understand]

[phase-state:2-baseline]
Current Phase: Establish baseline
Gate: Code understood ✓
📍 Next: Enter planning after baseline is established
[/phase-state:2-baseline]

[phase-state:3-plan]
Current Phase: Plan refactoring steps
Gate: Test baseline established ✓
📍 Next: Execute step-by-step after plan confirmation
[/phase-state:3-plan]

[phase-state:4-execute]
Current Phase: Incremental execution
Gate: User confirmed plan ✓
📍 Next: Verify tests pass after each step of execution
[/phase-state:4-execute]

[phase-state:5-verify]
Current Phase: Final verification
Gate: All steps executed ✓
📍 Next: Report results after all tests pass
[/phase-state:5-verify]

---

## Phase Details

### Phase 1: Understand [required]

**Task Update**: `currentPhase → "1-understand"`, `nextAction → "Read code, map dependencies"`

1. Read all files involved in the refactoring.
2. Map dependency relationships (Who calls this code? Who is called by this code?).
3. Identify public API / interface boundaries (these cannot be changed easily).
4. Document current behavioral characteristics.

### Phase 2: Establish Baseline [required]

1. Run existing tests: `pnpm test` / `go test` / `pytest` etc.
2. Record test results as baseline.
3. If there are no relevant tests → Inform the user; recommended but not mandatory to add tests first.
4. Output baseline state:
   ```
   📊 Test Baseline
     Passed: [N]
     Failed: [M] (pre-existing, not introduced by refactoring)
     Coverage: [Test coverage status of relevant modules]
   ```

### Phase 3: Planning

Develop an incremental refactoring plan; each step should be able to pass tests independently:

```
📋 Refactoring Plan

## Goals
[Refactoring goals and expected effects]

## Steps (Each step independently verifiable)
1. [Step description] — Affected files: [...]
2. [Step description] — Affected files: [...]
...

## Invariants
- [Behaviors/interfaces that should not change]
```

For L/XL tasks, optionally invoke external models for architectural review.

Display plan and wait for user confirmation.

### Phase 4: Incremental Execution

**Task Update**: `currentPhase → "4-execute"`, `nextAction → "Execute refactoring step-by-step"`

**Execute step-by-step**, after each step:
1. Apply changes.
2. Run tests.
3. If tests pass → Proceed to the next step.
4. If tests fail → **Stop immediately**, analyze the cause, fix or roll back.

Report after each step:
```
Step [N/M]: [Description] — ✅ Tests Passed / ❌ Tests Failed
```

### Phase 5: Iterative Review [Ralph Loop]

1. Run the complete test suite.
2. Compare against baseline: Ensure no new failures are introduced.

Refer to `phase-guide.md § 10 Ralph Loop` to execute iterative reviews (max 3 rounds).

#### Round N Workflow

**⛔ Dual-model cross-review (each round spawns a new call, clean context):**

3. Get changes: full output of `git diff`.
4. Parallel invoke dual-model review (`run_in_background: true`):
   - backend model + reviewer role — Focus on security, performance, error handling, behavioral consistency.
   - frontend model + reviewer role — Focus on accessibility, design consistency (if frontend is involved).
5. Wait for dual-model results and synthesize review feedback.

**⛔ Quality Gates (must invoke each Skill individually; do not skip; do not substitute with own judgment):**

6. Invoke Skill `verify-quality` — Wait for report.
7. Invoke Skill `verify-security` — Wait for report.
8. Invoke Skill `verify-change` — Wait for report.

**Synthesized Report**: Dual-model review + quality gates, graded by severity.

**User Decision (⛔ Must wait):**
- Critical exists → `Found N Critical issues. Fix and review again? [Y/n]`
- No Critical exists → `Review passed. Review another round? [y/N]`
- User chooses to continue → Return to Round N+1 after fixing issues.
- User chooses to stop → Exit review loop.

Append progress to `.ccg/tasks/{task-name}/fix-log.jsonl`.

9. Display all changes using `git diff`.
10. Compare against baseline to confirm no regression.
11. Output results:
    ```
    ✅ Refactoring Complete
      Steps: All [N] steps passed
      Changes: [File count] files, [Line count] lines
      Tests: Baseline [N] passed → Post-refactor [N] passed
      Review: [N] rounds, [Critical: N, Warning: N, Info: N]
      📍 Next: /ccg:commit to submit
    ```

#### Spec Evolution (Must execute before archiving)

Refer to `phase-guide.md § 8 Spec Evolution Protocol` to execute:
1. Analyze this refactoring's `git diff` to distill reusable refactoring patterns and architectural conventions.
2. If there are experiences worth recording → Draft Spec entries, present them to the user for confirmation, and append them to `.ccg/spec/{domain}/index.md`.
3. If there are no experiences worth distilling → Skip.

**Task Update**: `status → "archived"`

**Archive Task**:
```bash
mkdir -p .ccg/tasks/archive/$(date +%Y-%m) && mv .ccg/tasks/{task-name} .ccg/tasks/archive/$(date +%Y-%m)/
git add .ccg/tasks/ && git commit -m "chore: archive ccg task"
```

---

## Hard Rules

- **Do not make massive changes all at once** — Must break down into incremental steps.
- **Must verify tests after each step** — Stop immediately if tests fail.
- **Keep behavior unchanged** — Unless the refactoring goal explicitly includes behavioral changes.
- **Do not expand scope** — Only refactor within the user-specified scope.
